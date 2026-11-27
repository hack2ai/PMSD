const { ipKeyGenerator } = require("express-rate-limit");

const WINDOW_MS = 60 * 1000;
const LIMIT = 15;
const buckets = new Map();

const getKey = (req) =>
    req.user?.id ? String(req.user.id) : ipKeyGenerator(req.ip) || "anonymous";

const cleanup = (now) => {
    if (buckets.size < 5000) return;

    for (const [key, timestamps] of buckets.entries()) {
        const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
        if (active.length === 0) buckets.delete(key);
        else buckets.set(key, active);
    }
};

const lectureAccessRateLimit = (req, res, next) => {
    const now = Date.now();
    const key = getKey(req);
    const timestamps = (buckets.get(key) || []).filter(
        (timestamp) => now - timestamp < WINDOW_MS
    );

    cleanup(now);

    if (timestamps.length >= LIMIT) {
        res.setHeader("Retry-After", "60");
        res.setHeader("RateLimit-Limit", String(LIMIT));
        res.setHeader("RateLimit-Remaining", "0");
        return res.status(429).json({
            success: false,
            code: "ACCESS_RATE_LIMITED",
            message: "Too many lecture access checks. Please try again shortly.",
            requestId: req.requestId
        });
    }

    timestamps.push(now);
    buckets.set(key, timestamps);

    res.setHeader("RateLimit-Limit", String(LIMIT));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, LIMIT - timestamps.length)));

    return next();
};

module.exports = lectureAccessRateLimit;