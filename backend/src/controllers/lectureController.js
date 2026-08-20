const fs = require("fs");
const crypto = require("crypto");
const {
    getLecturesForCourse,
    createModule,
    getModulesForCourse,
    createLecture,
    writeAuditLog
} = require("../models/lectureModel");
const {
    getOrCreateWatermarkId,
    countActiveSessions,
    createSecureSession,
    getProgress,
    upsertProgress,
    revokeOldestActiveSession,
    listActiveSessions,
    revokeSession
} = require("../models/learningSecurityModel");
const { resolvePrivateMediaPath } = require("../middleware/lectureAccessMiddleware");

const clientIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
const deviceFingerprint = (req) => crypto.createHash("sha256")
    .update(`${req.get("user-agent") || ""}|${clientIp(req) || ""}`)
    .digest("hex");

const makeWatermarkCode = (watermarkId, sessionId) =>
    `${String(watermarkId).slice(0, 8).toUpperCase()}-${String(sessionId).slice(0, 8).toUpperCase()}`;

const listCourseLectures = async (req, res, next) => {
    try {
        const lectures = await getLecturesForCourse(req.params.courseId, req.user.role === "admin");
        res.json({ success: true, lectures });
    } catch (err) {
        next(err);
    }
};

const listCourseModules = async (req, res, next) => {
    try {
        const modules = await getModulesForCourse(req.params.courseId);
        res.json({ success: true, modules });
    } catch (err) {
        next(err);
    }
};

const createCourseModule = async (req, res, next) => {
    try {
        const { title, description, position = 1 } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Module title is required." });
        const module = await createModule(req.params.courseId, title, description, position);
        res.status(201).json({ success: true, module });
    } catch (err) {
        next(err);
    }
};

const createNewLecture = async (req, res, next) => {
    try {
        const { title, description, position = 1, contentType, sourceType, telegramChatId,
            telegramMessageId, storageKey, durationSeconds, status, availableFrom } = req.body;

        if (!title || !req.params.moduleId) {
            return res.status(400).json({ success: false, message: "Module and lecture title are required." });
        }

        const lecture = await createLecture({
            moduleId: req.params.moduleId,
            title,
            description,
            position,
            contentType,
            sourceType,
            telegramChatId,
            telegramMessageId,
            storageKey,
            durationSeconds,
            status,
            availableFrom,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, lecture });
    } catch (err) {
        next(err);
    }
};

const getLectureAccess = async (req, res, next) => {
    try {
        const lecture = req.lecture;
        const watermark = await getOrCreateWatermarkId(req.user.id);
        const sessionId = crypto.randomUUID();
        const fingerprint = deviceFingerprint(req);
        const activeSessions = await countActiveSessions(req.user.id);

        if (activeSessions >= 2) {
            await revokeOldestActiveSession(req.user.id);
        }

        const watermarkCode = makeWatermarkCode(watermark.learning_watermark_id, sessionId);
        const session = await createSecureSession({
            id: sessionId,
            userId: req.user.id,
            lectureId: lecture.id,
            ipAddress: clientIp(req),
            userAgent: req.get("user-agent"),
            deviceFingerprint: fingerprint,
            watermarkCode
        });

        await writeAuditLog({
            userId: req.user.id,
            action: "lecture.access",
            resourceType: "lecture",
            resourceId: String(lecture.id),
            ipAddress: clientIp(req),
            userAgent: req.get("user-agent"),
            metadata: { sessionId, watermarkCode }
        });

        const progress = await getProgress(req.user.id, lecture.id);

        res.json({
            success: true,
            lecture: {
                id: lecture.id,
                title: lecture.title,
                description: lecture.description,
                contentType: lecture.content_type,
                durationSeconds: lecture.duration_seconds,
                moduleTitle: lecture.module_title
            },
            sessionId: session.id,
            watermarkCode: session.watermark_code,
            streamUrl: `/api/lectures/${lecture.id}/stream?session=${encodeURIComponent(session.id)}`,
            progress
        });
    } catch (err) {
        next(err);
    }
};

const saveLectureProgress = async (req, res, next) => {
    try {
        const progress = await upsertProgress({
            userId: req.user.id,
            lectureId: req.params.id,
            watchedSeconds: req.body.watchedSeconds,
            lastPositionSeconds: req.body.lastPositionSeconds,
            completed: req.body.completed
        });
        res.json({ success: true, progress });
    } catch (err) {
        next(err);
    }
};

const listSecuritySessions = async (req, res, next) => {
    try {
        res.json({ success: true, sessions: await listActiveSessions() });
    } catch (err) {
        next(err);
    }
};

const revokeSecuritySession = async (req, res, next) => {
    try {
        const revoked = await revokeSession(req.params.sessionId);
        if (!revoked) return res.status(404).json({ success: false, message: "Session not found." });
        res.json({ success: true, message: "Session revoked." });
    } catch (err) {
        next(err);
    }
};

const streamLecture = async (req, res, next) => {
    try {
        const filePath = resolvePrivateMediaPath(req.lecture.storage_key);
        const stat = await fs.promises.stat(filePath).catch(() => null);

        if (!stat || !stat.isFile()) {
            return res.status(404).json({ success: false, message: "Lecture media is unavailable." });
        }

        const range = req.headers.range;
        const contentType = req.lecture.content_type === "video" ? "video/mp4" : "application/octet-stream";

        if (!range) {
            res.status(200).set({
                "Content-Type": contentType,
                "Content-Length": stat.size,
                "Accept-Ranges": "bytes",
                "Cache-Control": "private, no-store",
                "Content-Disposition": "inline"
            });
            return fs.createReadStream(filePath).pipe(res);
        }

        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) return res.status(416).end();

        const start = Number(match[1] || 0);
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start >= stat.size || end < start || end >= stat.size) {
            res.status(416).set("Content-Range", `bytes */${stat.size}`).end();
            return;
        }

        res.status(206).set({
            "Content-Type": contentType,
            "Content-Length": end - start + 1,
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, no-store",
            "Content-Disposition": "inline"
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listCourseLectures,
    listCourseModules,
    createCourseModule,
    createNewLecture,
    getLectureAccess,
    saveLectureProgress,
    listSecuritySessions,
    revokeSecuritySession,
    streamLecture
};
