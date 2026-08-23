const webhookRawBody = (req, res, next) => {
    const chunks = [];

    req.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
        req.rawBody = Buffer.concat(chunks);

        try {
            req.body = req.rawBody.length
                ? JSON.parse(req.rawBody.toString("utf8"))
                : {};
        } catch {
            return res.status(400).json({
                success: false,
                code: "INVALID_WEBHOOK_JSON",
                message: "Webhook payload is not valid JSON."
            });
        }

        next();
    });

    req.on("error", () => {
        res.status(400).json({
            success: false,
            code: "INVALID_WEBHOOK_BODY",
            message: "Unable to read webhook payload."
        });
    });
};

module.exports = webhookRawBody;
