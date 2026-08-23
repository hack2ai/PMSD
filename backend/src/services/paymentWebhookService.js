const crypto = require("crypto");
const pool = require("../config/db");

const getWebhookSecret = (provider) => {
    const normalized = String(provider || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    return process.env[`PAYMENT_WEBHOOK_SECRET_${normalized}`] || process.env.PAYMENT_WEBHOOK_SECRET;
};

const verifySignature = ({ provider, rawBody, signature }) => {
    const secret = getWebhookSecret(provider);
    if (!secret || !signature || !rawBody) return false;

    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), "utf8");
    const expected = crypto.createHmac("sha256", secret).update(body).digest();
    const providedHex = String(signature).trim().replace(/^sha256=/i, "");

    if (!/^[a-f0-9]{64}$/i.test(providedHex)) return false;
    const provided = Buffer.from(providedHex, "hex");

    return provided.length === expected.length && crypto.timingSafeEqual(expected, provided);
};

const normalizeStatus = (eventType, payloadStatus) => {
    const value = String(payloadStatus || eventType || "").toLowerCase();
    if (["paid", "payment.succeeded", "payment_success", "success", "captured"].includes(value)) return "Paid";
    if (["failed", "payment.failed", "failure", "declined"].includes(value)) return "Failed";
    if (["cancelled", "canceled", "payment.cancelled"].includes(value)) return "Cancelled";
    if (["refunded", "payment.refunded", "refund"].includes(value)) return "Refunded";
    return null;
};

const processWebhookEvent = async ({ provider, eventId, eventType, transactionId, payload, signature, rawBody }) => {
    if (!provider || !eventId || !eventType || !transactionId || !payload || !rawBody) {
        return { statusCode: 400, body: { success: false, code: "INVALID_WEBHOOK", message: "Required webhook fields are missing." } };
    }

    if (!verifySignature({ provider, rawBody, signature })) {
        return { statusCode: 401, body: { success: false, code: "INVALID_SIGNATURE", message: "Webhook signature is invalid." } };
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const inserted = await client.query(
            `INSERT INTO payment_webhook_events
                (provider, event_id, event_type, transaction_id, signature_valid, payload)
             VALUES ($1, $2, $3, $4, TRUE, $5::jsonb)
             ON CONFLICT (provider, event_id) DO NOTHING
             RETURNING id`,
            [provider, eventId, eventType, transactionId, JSON.stringify(payload)]
        );

        if (inserted.rowCount === 0) {
            await client.query("ROLLBACK");
            return { statusCode: 200, body: { success: true, code: "WEBHOOK_ALREADY_PROCESSED" } };
        }

        const nextStatus = normalizeStatus(eventType, payload.status || payload.payment_status);
        if (!nextStatus) {
            await client.query(
                `UPDATE payment_webhook_events
                 SET processing_status = 'IGNORED', processed_at = NOW()
                 WHERE id = $1`,
                [inserted.rows[0].id]
            );
            await client.query("COMMIT");
            return { statusCode: 200, body: { success: true, code: "WEBHOOK_IGNORED" } };
        }

        const paymentResult = await client.query(
            `UPDATE payments
             SET payment_status = $1
             WHERE transaction_id = $2
               AND payment_status = 'Pending'
             RETURNING id, payment_status`,
            [nextStatus, transactionId]
        );

        if (paymentResult.rowCount === 0) {
            await client.query(
                `UPDATE payment_webhook_events
                 SET processing_status = 'FAILED', processing_error = $2, processed_at = NOW()
                 WHERE id = $1`,
                [inserted.rows[0].id, "PAYMENT_NOT_PENDING_OR_NOT_FOUND"]
            );
            await client.query("COMMIT");
            return { statusCode: 409, body: { success: false, code: "PAYMENT_NOT_PENDING", message: "Payment was not found or is already finalized." } };
        }

        await client.query(
            `UPDATE payment_webhook_events
             SET processing_status = 'PROCESSED', processed_at = NOW()
             WHERE id = $1`,
            [inserted.rows[0].id]
        );

        await client.query("COMMIT");
        return {
            statusCode: 200,
            body: {
                success: true,
                code: "PAYMENT_STATUS_UPDATED",
                payment: paymentResult.rows[0]
            }
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    verifySignature,
    processWebhookEvent
};
