const rateLimit = require("express-rate-limit");

const lectureAccessRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || req.ip),
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            code: "ACCESS_RATE_LIMITED",
            message: "Too many lecture access checks. Please try again shortly.",
            requestId: req.requestId
        });
    }
});

module.exports = lectureAccessRateLimit;
