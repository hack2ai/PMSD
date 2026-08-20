const fs = require("fs");
const {
    getLecturesForCourse,
    createModule,
    getModulesForCourse,
    createLecture,
    writeAuditLog
} = require("../models/lectureModel");
const { resolvePrivateMediaPath } = require("../middleware/lectureAccessMiddleware");

const clientIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || null;

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
            sessionId: req.learningSessionId,
            streamUrl: `/api/lectures/${lecture.id}/stream?session=${encodeURIComponent(req.learningSessionId)}`
        });
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

        await writeAuditLog({
            userId: req.user.id,
            action: "lecture.stream",
            resourceType: "lecture",
            resourceId: String(req.lecture.id),
            ipAddress: clientIp(req),
            userAgent: req.get("user-agent"),
            metadata: { sessionId: req.learningSessionId }
        });

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
    streamLecture
};
