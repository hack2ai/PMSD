const { resolveLectureAccess } = require("../services/accessService");

const requestLectureAccess = async (req, res) => {
    try {
        const result = await resolveLectureAccess({
            lectureId: req.params.lectureId,
            user: req.user,
            ip: req.ip,
            userAgent: req.get("user-agent")
        });

        return res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error("requestLectureAccess error:", error);
        return res.status(500).json({
            success: false,
            code: "ACCESS_RESOLUTION_ERROR",
            message: "Unable to resolve lecture access right now."
        });
    }
};

module.exports = { requestLectureAccess };
