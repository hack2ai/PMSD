const { resolveLectureAccess } = require("../services/accessService");

const requestLectureAccess = async (req, res) => {
    try {
        const result = await resolveLectureAccess({
            lectureId: req.params.lectureId,
            user: req.user,
            ip: req.ip,
            userAgent: req.get("user-agent"),
            requestId: req.requestId
        });

        return res.status(result.statusCode).json({
            ...result.body,
            requestId: req.requestId
        });
    } catch (error) {
        console.error(JSON.stringify({
            level: "error",
            event: "lecture_access_resolution_error",
            requestId: req.requestId,
            lectureId: req.params.lectureId,
            error: error.message || String(error)
        }));

        return res.status(500).json({
            success: false,
            code: "ACCESS_RESOLUTION_ERROR",
            message: "Unable to resolve lecture access right now.",
            requestId: req.requestId
        });
    }
};

module.exports = { requestLectureAccess };
