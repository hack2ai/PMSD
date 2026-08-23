const assert = require("assert");
const { validatePaymentAmount } = require("../src/utils/paymentValidation");

assert.deepStrictEqual(
    validatePaymentAmount({ requestedAmount: 499.00, coursePrice: 499 }),
    { ok: true, amount: 499 }
);

assert.strictEqual(
    validatePaymentAmount({ requestedAmount: 1, coursePrice: 499 }).code,
    "AMOUNT_MISMATCH"
);

assert.strictEqual(
    validatePaymentAmount({ requestedAmount: 499, coursePrice: 0 }).code,
    "FREE_COURSE"
);

assert.strictEqual(
    validatePaymentAmount({ requestedAmount: "bad", coursePrice: 499 }).code,
    "INVALID_AMOUNT"
);

assert.strictEqual(
    validatePaymentAmount({ requestedAmount: 499, coursePrice: -1 }).code,
    "INVALID_COURSE_PRICE"
);

console.log("paymentAmountValidation tests passed");
