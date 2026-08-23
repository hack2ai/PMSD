const { processWebhookEvent } = require("../services/paymentWebhookService");

const receivePaymentWebhook = async (req, res) => {
    try {
        const provider = req.params.provider;
        const signature = req.get("x-pmsd-signature") || req.get("x-webhook-signature");
        const rawBody = req.rawBody || JSON.stringify(req.body || {});
        const { event_id, event_type, transaction_id, payload } = req.body || {};

        const result = await processWebhookEvent({
            provider,
            eventId: event_id,
            eventType: event_type,
            transactionId: transaction_id,
            payload: payload || req.body,
            signature,
            rawBody
        });

        return res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error("receivePaymentWebhook error:", error);
        return res.status(500).json({
            success: false,
            code: "WEBHOOK_PROCESSING_ERROR",
            message: "Unable to process payment webhook."
        });
    }
};

module.exports = { receivePaymentWebhook };
