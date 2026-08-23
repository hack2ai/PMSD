const assert = require("assert");
const crypto = require("crypto");
const { verifySignature } = require("../src/services/paymentWebhookService");

process.env.PAYMENT_WEBHOOK_SECRET_TEST_PROVIDER = "test-webhook-secret";

const rawBody = Buffer.from(JSON.stringify({
    event_id: "evt_123",
    event_type: "payment.succeeded",
    transaction_id: "PENDING-123",
    payload: { status: "paid" }
}));

const signature = crypto
    .createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET_TEST_PROVIDER)
    .update(rawBody)
    .digest("hex");

assert.strictEqual(
    verifySignature({
        provider: "test-provider",
        rawBody,
        signature
    }),
    true
);

assert.strictEqual(
    verifySignature({
        provider: "test-provider",
        rawBody,
        signature: `${signature.slice(0, -1)}0`
    }),
    false
);

assert.strictEqual(
    verifySignature({
        provider: "test-provider",
        rawBody: Buffer.from(rawBody.toString().replace("evt_123", "evt_124")),
        signature
    }),
    false
);

assert.strictEqual(
    verifySignature({
        provider: "test-provider",
        rawBody,
        signature: `sha256=${signature}`
    }),
    true
);

assert.strictEqual(
    verifySignature({
        provider: "unknown-provider",
        rawBody,
        signature
    }),
    false
);

console.log("paymentWebhook signature tests passed");
