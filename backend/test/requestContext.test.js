const assert = require("assert");
const requestContext = require("../src/middleware/requestContext");

const run = ({ incomingId }) => {
    const headers = {};
    const req = {
        get(name) {
            return name.toLowerCase() === "x-request-id" ? incomingId : undefined;
        }
    };
    const res = {
        setHeader(name, value) {
            headers[name] = value;
        }
    };
    let nextCalled = false;

    requestContext(req, res, () => {
        nextCalled = true;
    });

    return { req, headers, nextCalled };
};

const preserved = run({ incomingId: "trace-123" });
assert.strictEqual(preserved.req.requestId, "trace-123");
assert.strictEqual(preserved.headers["X-Request-Id"], "trace-123");
assert.strictEqual(preserved.nextCalled, true);

const generated = run({ incomingId: "bad id with spaces" });
assert.ok(generated.req.requestId);
assert.notStrictEqual(generated.req.requestId, "bad id with spaces");
assert.strictEqual(generated.headers["X-Request-Id"], generated.req.requestId);

const rejectedLong = run({ incomingId: "x".repeat(129) });
assert.ok(rejectedLong.req.requestId);
assert.notStrictEqual(rejectedLong.req.requestId.length, 129);

console.log("requestContext tests passed");
