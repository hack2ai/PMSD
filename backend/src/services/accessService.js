const crypto = require("crypto");
const pool = require("../config/db");
const lectureModel = require("../models/lectureModel");
const lectureSourceModel = require("../models/lectureSourceModel");
const accessAttemptModel = require("../models/accessAttemptModel");

const hashIp = (ip) => {
    const salt = process.env.ACCESS_LOG_SALT || "pmsd-access-log";
    return crypto.createHash("sha256").update(`${salt}:${ip || "unknown"}`).digest("hex");
};

const isEnrolled = async (userId, courseId) => {
    const result = await pool.query(
        `SELECT 1
         FROM enrollments
         WHERE user_id = $1 AND course_id = $2
         LIMIT 1`,
        [userId, courseId]
    );
    return result.rowCount > 0;
};

const isExpired = (expiresAt) => expiresAt && new Date(expiresAt).getTime() <= Date.now();

const resolveLectureAccess = async ({ lectureId, user, ip, userAgent }) => {
    const lecture = await lectureModel.getLectureById(lectureId);

    if (!lecture) {
        return { statusCode: 404, body: { success: false, code: "LECTURE_NOT_FOUND", message: "Lecture not found." } };
    }

    if (!["admin", "instructor"].includes(user.role)) {
        const enrolled = await isEnrolled(user.id, lecture.course_id);
        if (!enrolled) {
            await accessAttemptModel.createAccessAttempt({
                lectureId,
                userId: user.id,
                status: "DENIED",
                reason: "NOT_ENROLLED",
                ipHash: hashIp(ip),
                userAgent
            });
            return { statusCode: 403, body: { success: false, code: "NOT_ENROLLED", message: "You are not enrolled in this course." } };
        }
    }

    if (lecture.status !== "PUBLISHED" && !["admin", "instructor"].includes(user.role)) {
        await accessAttemptModel.createAccessAttempt({
            lectureId,
            userId: user.id,
            status: "DENIED",
            reason: "LECTURE_NOT_PUBLISHED",
            ipHash: hashIp(ip),
            userAgent
        });
        return { statusCode: 403, body: { success: false, code: "LECTURE_NOT_PUBLISHED", message: "This lecture is not currently available." } };
    }

    const sources = await lectureSourceModel.getSourcesByLectureId(lectureId, false);
    const candidates = sources.filter((source) => !isExpired(source.expires_at) && source.status !== "DISABLED");

    if (candidates.length === 0) {
        await accessAttemptModel.createAccessAttempt({
            lectureId,
            userId: user.id,
            status: "UNAVAILABLE",
            reason: "NO_AVAILABLE_SOURCE",
            ipHash: hashIp(ip),
            userAgent
        });
        return { statusCode: 503, body: { success: false, code: "NO_AVAILABLE_SOURCE", message: "No approved lecture source is currently available." } };
    }

    const source = candidates.find((item) => item.status === "AVAILABLE") ||
        candidates.find((item) => item.status === "REQUIRES_AUTH") ||
        candidates[0];

    if (source.status === "REQUIRES_AUTH" || source.requires_auth) {
        await accessAttemptModel.createAccessAttempt({
            lectureId,
            userId: user.id,
            sourceId: source.id,
            status: "REQUIRES_AUTH",
            reason: "AUTHORIZED_SOURCE_REQUIRES_AUTH",
            ipHash: hashIp(ip),
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
        reason: "APPROVED_SOURCE_SELECTED",
        ipHash: hashIp(ip),
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
