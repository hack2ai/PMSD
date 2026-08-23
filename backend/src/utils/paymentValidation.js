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

    const normalizedRequested = Number(requested.toFixed(2));
    const normalizedPrice = Number(price.toFixed(2));

    if (normalizedRequested !== normalizedPrice) {
        return { ok: false, code: "AMOUNT_MISMATCH" };
    }

    return { ok: true, amount: normalizedPrice };
};

module.exports = { validatePaymentAmount };
