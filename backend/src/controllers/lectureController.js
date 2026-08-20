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
const { signMediaToken } = require("../services/mediaTokenService");

const clientIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
const deviceFingerprint = (req) => crypto.createHash("sha256")
    .update(`${req.get("user-agent") || ""}|${clientIp(req) || ""}`)
    .digest("hex");
const makeWatermarkCode = (watermarkId, sessionId) =>
    `${String(watermarkId).slice(0, 8).toUpperCase()}-${String(sessionId).slice(0, 8).toUpperCase()}`;

const listCourseLectures = async (req, res, next) => {
    try {
        res.json({ success: true, lectures: await getLecturesForCourse(req.params.courseId, req.user.role === "admin") });
    } catch (err) { next(err); }
};

const listCourseModules = async (req, res, next) => {
    try {
        res.json({ success: true, modules: await getModulesForCourse(req.params.courseId) });
    } catch (err) { next(err); }
};

const createCourseModule = async (req, res, next) => {
    try {
        const { title, description, position = 1 } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Module title is required." });
        res.status(201).json({ success: true, module: await createModule(req.params.courseId, title, description, position) });
    } catch (err) { next(err); }
};

const createNewLecture = async (req, res, next) => {
    try {
        const { title, description, position = 1, contentType, sourceType, telegramChatId,
            telegramMessageId, storageKey, durationSeconds, status, availableFrom } = req.body;
        if (!title || !req.params.moduleId) {
            return res.status(400).json({ success: false, message: "Module and lecture title are required." });
        }
        const lecture = await createLecture({
            moduleId: req.params.moduleId, title, description, position, contentType, sourceType,
            telegramChatId, telegramMessageId, storageKey, durationSeconds, status, availableFrom,
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, lecture });
    } catch (err) { next(err); }
};

const getLectureAccess = async (req, res, next) => {
    try {
        const lecture = req.lecture;
        const watermark = await getOrCreateWatermarkId(req.user.id);
        const sessionId = crypto.randomUUID();
        const fingerprint = deviceFingerprint(req);
        if (await countActiveSessions(req.user.id) >= 2) await revokeOldestActiveSession(req.user.id);

        const watermarkCode = makeWatermarkCode(watermark.learning_watermark_id, sessionId);
        const session = await createSecureSession({
            id: sessionId, userId: req.user.id, lectureId: lecture.id,
            ipAddress: clientIp(req), userAgent: req.get("user-agent"),
            deviceFingerprint: fingerprint, watermarkCode
        });
        const mediaToken = signMediaToken({ userId: req.user.id, lectureId: lecture.id, sessionId });
        const progress = await getProgress(req.user.id, lecture.id);

        await writeAuditLog({
            userId: req.user.id, action: "lecture.access", resourceType: "lecture", resourceId: String(lecture.id),
            ipAddress: clientIp(req), userAgent: req.get("user-agent"), metadata: { sessionId, watermarkCode }
        });

        res.json({
            success: true,
            lecture: {
                id: lecture.id, title: lecture.title, description: lecture.description,
                contentType: lecture.content_type, durationSeconds: lecture.duration_seconds, moduleTitle: lecture.module_title
            },
            sessionId: session.id,
            watermarkCode: session.watermark_code,
            streamUrl: `/api/lectures/${lecture.id}/stream?session=${encodeURIComponent(session.id)}&mediaToken=${encodeURIComponent(mediaToken)}`,
            progress
        });
    } catch (err) { next(err); }
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
    } catch (err) { next(err); }
};

const listSecuritySessions = async (req, res, next) => {
    try { res.json({ success: true, sessions: await listActiveSessions() }); }
    catch (err) { next(err); }
};

const revokeSecuritySession = async (req, res, next) => {
    try {
        const revoked = await revokeSession(req.params.sessionId);
        if (!revoked) return res.status(404).json({ success: false, message: "Session not found." });
        res.json({ success: true, message: "Session revoked." });
    } catch (err) { next(err); }
};

const streamLecture = async (req, res, next) => {
    try {
        const filePath = resolvePrivateMediaPath(req.lecture.storage_key);
        const stat = await fs.promises.stat(filePath).catch(() => null);
        if (!stat || !stat.isFile()) return res.status(404).json({ success: false, message: "Lecture media is unavailable." });

        await writeAuditLog({
            userId: req.user.id, action: "lecture.stream", resourceType: "lecture", resourceId: String(req.lecture.id),
            ipAddress: clientIp(req), userAgent: req.get("user-agent"), metadata: { sessionId: req.learningSessionId }
        });

        res.set({ "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "Content-Disposition": "inline" });
        const contentType = req.lecture.content_type === "video" ? "video/mp4" : "application/octet-stream";
        const range = req.headers.range;

        if (!range) {
            res.status(200).set({ "Content-Type": contentType, "Content-Length": stat.size });
            return fs.createReadStream(filePath).pipe(res);
        }

        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) return res.status(416).end();
        const start = Number(match[1] || 0);
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start >= stat.size || end < start || end >= stat.size) return res.status(416).set("Content-Range", `bytes */${stat.size}`).end();

        res.status(206).set({
            "Content-Type": contentType,
            "Content-Length": end - start + 1,
            "Content-Range": `bytes ${start}-${end}/${stat.size}`
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } catch (err) { next(err); }
};

module.exports = {
    listCourseLectures, listCourseModules, createCourseModule, createNewLecture,
    getLectureAccess, saveLectureProgress, listSecuritySessions, revokeSecuritySession, streamLecture
};
