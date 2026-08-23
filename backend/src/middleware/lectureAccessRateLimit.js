const rateLimit = require("express-rate-limit");

const lectureAccessRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || req.ip),
    message: {
        success: false,
        code: "ACCESS_RATE_LIMITED",
        message: "Too many lecture access checks. Please try again shortly."
    }
});

module.exports = lectureAccessRateLimit;
