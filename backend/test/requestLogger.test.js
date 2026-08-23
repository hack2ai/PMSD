const assert = require("assert");
const requestLogger = require("../src/middleware/requestLogger");

const originalLog = console.log;
const logs = [];
console.log = (line) => logs.push(line);

const listeners = {};
const req = {
    requestId: "req-logger-123",
    method: "GET",
    path: "/api/courses",
    route: { path: "/" }
};
const res = {
    statusCode: 200,
    on(event, handler) {
        listeners[event] = handler;
    }
};

let nextCalled = false;
requestLogger(req, res, () => {
    nextCalled = true;
});

assert.strictEqual(nextCalled, true);
assert.ok(typeof listeners.finish === "function");
assert.ok(typeof listeners.close === "function");

listeners.finish();
listeners.close();

console.log = originalLog;

assert.strictEqual(logs.length, 1);
const entry = JSON.parse(logs[0]);
assert.strictEqual(entry.event, "http_request_completed");
assert.strictEqual(entry.requestId, "req-logger-123");
assert.strictEqual(entry.method, "GET");
assert.strictEqual(entry.path, "/");
assert.strictEqual(entry.status, 200);
assert.strictEqual(typeof entry.durationMs, "number");

console.log("requestLogger tests passed");
