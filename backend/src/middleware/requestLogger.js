const requestLogger = (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    let completed = false;

    const logCompletion = () => {
        if (completed) return;
        completed = true;

        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const status = res.statusCode;
        const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

        console.log(JSON.stringify({
            level,
            event: "http_request_completed",
            requestId: req.requestId,
            method: req.method,
            path: req.route?.path || req.path,
            status,
            durationMs: Number(durationMs.toFixed(2))
        }));
    };

    res.on("finish", logCompletion);
    res.on("close", logCompletion);
    next();
};

module.exports = requestLogger;
