const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const paymentWebhookRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => `${req.params.provider || "unknown"}:${ipKeyGenerator(req.ip)}`,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            code: "WEBHOOK_RATE_LIMITED",
            message: "Too many payment webhook requests. Please retry shortly.",
            requestId: req.requestId
        });
    }
});

module.exports = paymentWebhookRateLimit;