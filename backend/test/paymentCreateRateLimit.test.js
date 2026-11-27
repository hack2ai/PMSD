const assert = require("assert");
const paymentCreateRateLimit = require("../src/middleware/paymentCreateRateLimit");

assert.strictEqual(typeof paymentCreateRateLimit, "function");

const makeReq = (id) => ({ user: { id }, ip: "127.0.0.1", params: {} });
const makeRes = () => {
    const res = {
        statusCode: null,
        body: null,
        headers: {},
        setHeader(key, value) {
            this.headers[key] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
    return res;
};

const run = (req, res) =>
    new Promise((resolve) => {
        const maybePromise = paymentCreateRateLimit(req, res, () => {
            resolve(true);
        });
        if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.then(() => resolve(res.statusCode === 429 ? false : true));
        }
    });

(async () => {
    const userId = `test-user-${Date.now()}`;
    let blocked = false;

    for (let i = 0; i < 11; i++) {
        const req = makeReq(userId);
        const res = makeRes();
        const nextCalled = await run(req, res);

        if (!nextCalled) {
            blocked = true;
            assert.strictEqual(res.statusCode, 429);
            assert.strictEqual(res.body.code, "PAYMENT_CREATE_RATE_LIMITED");
            assert.ok(Object.prototype.hasOwnProperty.call(res.body, "requestId"));
            break;
        }
    }

    assert.ok(blocked, "expected the 11th request within the window to be rate-limited");

    console.log("paymentCreateRateLimit tests passed");
})();