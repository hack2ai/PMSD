const express = require("express");
const crypto = require("crypto");
const { updatePaymentStatusByTransactionId } = require("../models/paymentModel");

const router = express.Router();

const STATUS_MAP = Object.freeze({
    paid: "Paid",
    succeeded: "Paid",
    success: "Paid",
    failed: "Failed",
    failure: "Failed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    refunded: "Refunded"
});

const getSignature = (req) => (
    req.get("X-Webhook-Signature") ||
    req.get("X-PMSD-Signature") ||
    ""
).trim();

const verifySignature = (rawBody, signature, secret) => {
    if (!secret || !signature || !rawBody) return false;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    const supplied = signature.replace(/^sha256=/i, "").trim();
    if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;

    return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(supplied, "hex")
    );
};

router.post(
    "/",
    express.raw({ type: "application/json", limit: "256kb" }),
    async (req, res) => {
        const secret = process.env.PAYMENT_WEBHOOK_SECRET;
        const signature = getSignature(req);
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

        if (!secret) {
            return res.status(503).json({ success: false, message: "Payment webhook is not configured." });
        }

        if (!verifySignature(rawBody, signature, secret)) {
            return res.status(401).json({ success: false, message: "Invalid webhook signature." });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody.toString("utf8"));
        } catch {
            return res.status(400).json({ success: false, message: "Invalid webhook payload." });
        }

        const transactionId = String(
            payload.transactionId ?? payload.transaction_id ?? payload.paymentId ?? payload.payment_id ?? ""
        ).trim();
        const rawStatus = String(payload.status ?? payload.paymentStatus ?? payload.payment_status ?? "")
            .trim()
            .toLowerCase();
        const paymentStatus = STATUS_MAP[rawStatus];

        if (!transactionId || !paymentStatus) {
            return res.status(400).json({ success: false, message: "transactionId and a supported payment status are required." });
        }

        try {
            const payment = await updatePaymentStatusByTransactionId(transactionId, paymentStatus);

            if (!payment) {
                return res.status(404).json({ success: false, message: "Payment not found or lifecycle transition is not allowed." });
            }

            return res.status(200).json({
                success: true,
                message: "Payment webhook processed successfully.",
                paymentId: payment.id,
                paymentStatus: payment.payment_status
            });
        } catch (err) {
            console.error("payment webhook error:", err);
            return res.status(500).json({ success: false, message: "Unable to process payment webhook." });
        }
    }
);

module.exports = router;
