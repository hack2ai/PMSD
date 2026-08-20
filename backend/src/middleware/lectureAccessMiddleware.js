const path = require("path");
const { randomUUID } = require("crypto");
const verifyToken = require("./authMiddleware");
const { getLectureById, createLearningSession, writeAuditLog } = require("../models/lectureModel");
const pool = require("../config/db");

const getClientIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || null;
};

const requireLectureAccess = async (req, res, next) => {
    try {
        const lecture = await getLectureById(req.params.id);

        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }

        if (lecture.status !== "published") {
            return res.status(404).json({ success: false, message: "Lecture is not available." });
        }

        if (lecture.available_from && new Date(lecture.available_from) > new Date()) {
            return res.status(403).json({ success: false, message: "Lecture is not available yet." });
        }

        const enrollment = await pool.query(
            `
            SELECT 1
            FROM enrollments
            WHERE user_id = $1
              AND course_id = $2
            LIMIT 1
            `,
            [req.user.id, lecture.course_id]
        );

        if (enrollment.rowCount === 0) {
            await writeAuditLog({
                userId: req.user.id,
                action: "lecture.access_denied",
                resourceType: "lecture",
                resourceId: String(lecture.id),
                ipAddress: getClientIp(req),
                userAgent: req.get("user-agent"),
                metadata: { reason: "not_enrolled", courseId: lecture.course_id }
            });

            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course."
            });
        }

        if (!lecture.storage_key) {
            return res.status(409).json({
                success: false,
                message: "Lecture content is not ready yet."
            });
        }

        const sessionId = randomUUID();
        await createLearningSession({
            id: sessionId,
            userId: req.user.id,
            lectureId: lecture.id,
            ipAddress: getClientIp(req),
            userAgent: req.get("user-agent")
        });

        await writeAuditLog({
            userId: req.user.id,
            action: "lecture.access_granted",
            resourceType: "lecture",
            resourceId: String(lecture.id),
            ipAddress: getClientIp(req),
            userAgent: req.get("user-agent"),
            metadata: { sessionId, courseId: lecture.course_id }
        });

        req.lecture = lecture;
        req.learningSessionId = sessionId;
        next();
    } catch (err) {
        next(err);
    }
};

const resolvePrivateMediaPath = (storageKey) => {
    const root = path.resolve(process.env.PRIVATE_MEDIA_ROOT || path.join(process.cwd(), "private-media"));
    const candidate = path.resolve(root, storageKey);

    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
        const error = new Error("Invalid private media path.");
        error.status = 400;
        throw error;
    }

    return candidate;
};

module.exports = {
    verifyLectureAccess: [verifyToken, requireLectureAccess],
    resolvePrivateMediaPath
};
