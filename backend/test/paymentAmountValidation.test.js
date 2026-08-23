const assert = require("assert");

const validatePaymentAmount = ({ requestedAmount, coursePrice }) => {
    const requested = Number(requestedAmount);
    const price = Number(coursePrice);

    if (!Number.isFinite(requested) || requested <= 0) {
        return { ok: false, code: "INVALID_AMOUNT" };
    }

    if (!Number.isFinite(price) || price < 0) {
        return { ok: false, code: "INVALID_COURSE_PRICE" };
    }

    if (price <= 0) {
        return { ok: false, code: "FREE_COURSE" };
    }

    if (Number(requested.toFixed(2)) !== Number(price.toFixed(2))) {
        return { ok: false, code: "AMOUNT_MISMATCH" };
    }

    return { ok: true, amount: Number(price.toFixed(2)) };
};

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

console.log("paymentAmountValidation tests passed");
