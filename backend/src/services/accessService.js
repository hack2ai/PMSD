const crypto = require("crypto");
const pool = require("../config/db");
const lectureModel = require("../models/lectureModel");
const lectureSourceModel = require("../models/lectureSourceModel");
const accessAttemptModel = require("../models/accessAttemptModel");
const auditLogModel = require("../models/auditLogModel");

const hashIp = (ip) => {
    const salt = process.env.ACCESS_LOG_SALT || "pmsd-access-log";
    return crypto.createHash("sha256").update(`${salt}:${ip || "unknown"}`).digest("hex");
};

const writeAudit = async (data) => {
    try {
        await auditLogModel.createAuditLog(data);
    } catch (error) {
        console.error("audit log error:", error.message || error);
    }
};

const isEnrolled = async (userId, courseId) => {
    const result = await pool.query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
        [userId, courseId]
    );
    return result.rowCount > 0;
};

const hasPaidAccess = async (userId, courseId) => {
    const result = await pool.query(
        `SELECT 1 FROM payments
         WHERE user_id = $1
           AND course_id = $2
           AND LOWER(payment_status) = 'paid'
         ORDER BY paid_at DESC NULLS LAST, id DESC
         LIMIT 1`,
        [userId, courseId]
    );
    return result.rowCount > 0;
};

const isExpired = (expiresAt) => expiresAt && new Date(expiresAt).getTime() <= Date.now();

const recordDenied = async ({ lecture, user, reason, ipHash, userAgent }) => {
    await accessAttemptModel.createAccessAttempt({
        lectureId: lecture.id,
        userId: user?.id,
        status: "DENIED",
        reason,
        ipHash,
        userAgent
    });

    await writeAudit({
        actorUserId: user?.id,
        action: "LECTURE_ACCESS",
        entityType: "LECTURE",
        entityId: lecture.id,
        lectureId: lecture.id,
        outcome: "DENIED",
        reason,
        ipHash,
        userAgent
    });
};

const selectSource = (sources) => {
    const eligible = sources.filter((source) => {
        if (isExpired(source.expires_at) || !source.is_active) return false;
        return source.status === "AVAILABLE" || source.status === "REQUIRES_AUTH";
    });

    const source = eligible[0] || null;
    const sourceIndex = source ? eligible.findIndex((item) => item.id === source.id) : -1;
    return { source, sourceIndex, eligible };
};

const resolveLectureAccess = async ({ lectureId, user, ip, userAgent }) => {
    const ipHash = hashIp(ip);
    const lecture = await lectureModel.getLectureById(lectureId);

    if (!lecture) {
        await writeAudit({
            actorUserId: user?.id,
            action: "LECTURE_ACCESS",
            entityType: "LECTURE",
            entityId: lectureId,
            lectureId,
            outcome: "NOT_FOUND",
            reason: "LECTURE_NOT_FOUND",
            ipHash,
            userAgent
        });
        return {
            statusCode: 404,
            body: { success: false, code: "LECTURE_NOT_FOUND", message: "Lecture not found." }
        };
    }

    const privileged = ["admin", "instructor"].includes(user.role);

    if (!privileged) {
        const enrolled = await isEnrolled(user.id, lecture.course_id);
        if (!enrolled) {
            await recordDenied({ lecture, user, reason: "NOT_ENROLLED", ipHash, userAgent });
            return {
                statusCode: 403,
                body: { success: false, code: "NOT_ENROLLED", message: "You are not enrolled in this course." }
            };
        }

        if (Number(lecture.course_price || 0) > 0) {
            const paid = await hasPaidAccess(user.id, lecture.course_id);
            if (!paid) {
                await recordDenied({ lecture, user, reason: "PAYMENT_REQUIRED", ipHash, userAgent });
                return {
                    statusCode: 402,
                    body: {
                        success: false,
                        code: "PAYMENT_REQUIRED",
                        message: "A verified payment is required to access this course."
                    }
                };
            }
        }
    }

    if (lecture.status !== "PUBLISHED" && !privileged) {
        await recordDenied({ lecture, user, reason: "LECTURE_NOT_PUBLISHED", ipHash, userAgent });
        return {
            statusCode: 403,
            body: { success: false, code: "LECTURE_NOT_PUBLISHED", message: "This lecture is not currently available." }
        };
    }

    const sources = await lectureSourceModel.getSourcesByLectureId(lectureId, false);
    const { source, sourceIndex, eligible } = selectSource(sources);

    if (!source) {
        await accessAttemptModel.createAccessAttempt({
            lectureId,
            userId: user.id,
            status: "UNAVAILABLE",
            reason: "NO_HEALTHY_APPROVED_SOURCE",
            ipHash,
            userAgent
        });
        await writeAudit({
            actorUserId: user.id,
            action: "LECTURE_ACCESS",
            entityType: "LECTURE",
            entityId: lecture.id,
            lectureId: lecture.id,
            outcome: "UNAVAILABLE",
            reason: "NO_HEALTHY_APPROVED_SOURCE",
            ipHash,
            userAgent
        });
        return {
            statusCode: 503,
            body: { success: false, code: "NO_HEALTHY_APPROVED_SOURCE", message: "No healthy approved lecture source is currently available." }
        };
    }

    const fallbackUsed = sourceIndex > 0;
    const selectionReason = fallbackUsed ? "APPROVED_SOURCE_FALLBACK_SELECTED" : "APPROVED_SOURCE_SELECTED";

    if (source.status === "REQUIRES_AUTH" || source.requires_auth) {
        await accessAttemptModel.createAccessAttempt({
            lectureId,
            userId: user.id,
            sourceId: source.id,
            status: "REQUIRES_AUTH",
            reason: selectionReason,
            ipHash,
            userAgent
        });
        await writeAudit({
            actorUserId: user.id,
            action: "LECTURE_ACCESS",
            entityType: "LECTURE_SOURCE",
            entityId: source.id,
            lectureId: lecture.id,
            sourceId: source.id,
            outcome: "REQUIRES_AUTH",
            reason: selectionReason,
            metadata: { sourceType: source.source_type, priority: source.priority, fallbackUsed, eligibleSourceCount: eligible.length },
            ipHash,
            userAgent
        });
        return {
            statusCode: 200,
            body: {
                success: true,
                access: "REQUIRES_AUTH",
                code: "SOURCE_REQUIRES_AUTH",
                message: "This approved lecture source requires your authorized institutional session.",
                source: { id: source.id, label: source.label, sourceType: source.source_type }
            }
        };
    }

    await accessAttemptModel.createAccessAttempt({
        lectureId,
        userId: user.id,
        sourceId: source.id,
        status: "ALLOWED",
        reason: selectionReason,
        ipHash,
        userAgent
    });
    await writeAudit({
        actorUserId: user.id,
        action: "LECTURE_ACCESS",
        entityType: "LECTURE_SOURCE",
        entityId: source.id,
        lectureId: lecture.id,
        sourceId: source.id,
        outcome: "ALLOWED",
        reason: selectionReason,
        metadata: { sourceType: source.source_type, priority: source.priority, fallbackUsed, eligibleSourceCount: eligible.length },
        ipHash,
        userAgent
    });

    return {
        statusCode: 200,
        body: {
            success: true,
            access: "ALLOWED",
            lecture: { id: lecture.id, title: lecture.title },
            source: { id: source.id, label: source.label, sourceType: source.source_type, url: source.source_url }
        }
    };
};

module.exports = { resolveLectureAccess };
