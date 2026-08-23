const assert = require("assert");
const paymentCreateRateLimit = require("../src/middleware/paymentCreateRateLimit");

assert.strictEqual(typeof paymentCreateRateLimit, "function");
assert.ok(paymentCreateRateLimit.options);
assert.strictEqual(paymentCreateRateLimit.options.limit, 10);
assert.strictEqual(paymentCreateRateLimit.options.windowMs, 10 * 60 * 1000);

const handlerSource = paymentCreateRateLimit.options.handler.toString();
assert.ok(handlerSource.includes("PAYMENT_CREATE_RATE_LIMITED"));
assert.ok(handlerSource.includes("requestId"));

console.log("paymentCreateRateLimit tests passed");
