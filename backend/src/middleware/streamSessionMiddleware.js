const { getLectureById, findLearningSession, touchLearningSession } = require("../models/lectureModel");
const { verifyMediaToken } = require("../services/mediaTokenService");

const requireStreamSession = async (req, res, next) => {
    try {
        const lecture = await getLectureById(req.params.id);
        if (!lecture || lecture.status !== "published") {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }
        if (!lecture.storage_key) {
            return res.status(409).json({ success: false, message: "Lecture content is not ready yet." });
        }

        const sessionId = String(req.query.session || "");
        const mediaToken = String(req.query.mediaToken || "");
        if (!sessionId || !mediaToken) {
            return res.status(400).json({ success: false, message: "A valid media session is required." });
        }

        const decoded = verifyMediaToken(mediaToken);
        const userId = Number(decoded.sub);
        if (!Number.isInteger(userId) || userId < 1 ||
            String(decoded.lectureId) !== String(lecture.id) ||
            String(decoded.sessionId) !== sessionId) {
            return res.status(403).json({ success: false, message: "Media authorization is invalid." });
        }

        const session = await findLearningSession(sessionId, userId, lecture.id);
        if (!session) {
            return res.status(403).json({ success: false, message: "Learning session is invalid or revoked." });
        }

        await touchLearningSession(sessionId, userId);
        req.user = { id: userId };
        req.lecture = lecture;
        req.learningSessionId = sessionId;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Media authorization expired. Reopen the lecture." });
        }
        next(err);
    }
};

module.exports = requireStreamSession;
