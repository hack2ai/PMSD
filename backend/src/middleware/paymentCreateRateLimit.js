const rateLimit = require("express-rate-limit");

const paymentCreateRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || req.ip),
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            code: "PAYMENT_CREATE_RATE_LIMITED",
            message: "Too many payment requests. Please try again later.",
            requestId: req.requestId
        });
    }
});

module.exports = paymentCreateRateLimit;
