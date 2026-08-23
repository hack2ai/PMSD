const assert = require("assert");
const {
    isExpired,
    getAvailableSources,
    selectBestSource
} = require("../src/services/accessPolicy");

const now = Date.parse("2026-08-22T09:00:00.000Z");

assert.strictEqual(isExpired(null, now), false);
assert.strictEqual(isExpired("2026-08-22T08:59:59.000Z", now), true);
assert.strictEqual(isExpired("2026-08-22T09:01:00.000Z", now), false);

const sources = [
    { id: 1, priority: 20, is_active: true, status: "TEMPORARILY_UNAVAILABLE" },
    { id: 2, priority: 10, is_active: true, status: "AVAILABLE" },
    { id: 3, priority: 1, is_active: true, status: "AVAILABLE", expires_at: "2026-08-22T08:00:00.000Z" },
    { id: 4, priority: 5, is_active: false, status: "AVAILABLE" },
    { id: 5, priority: 30, is_active: true, status: "REQUIRES_AUTH", requires_auth: true },
    { id: 6, priority: 2, is_active: true, status: "UNKNOWN" },
    { id: 7, priority: 3, is_active: true, status: "MOVED" },
    { id: 8, priority: 4, is_active: true, status: "DISABLED" }
];

assert.strictEqual(getAvailableSources(sources, now).length, 2);
assert.deepStrictEqual(
    getAvailableSources(sources, now).map((source) => source.id),
    [2, 5]
);
assert.strictEqual(selectBestSource(sources, now).id, 2);

const fallbackSources = [
    { id: 10, priority: 1, is_active: true, status: "TEMPORARILY_UNAVAILABLE" },
    { id: 11, priority: 2, is_active: true, status: "AVAILABLE" },
    { id: 12, priority: 3, is_active: true, status: "AVAILABLE" }
];
assert.strictEqual(selectBestSource(fallbackSources, now).id, 11);

const authOnly = [
    { id: 8, priority: 50, is_active: true, status: "REQUIRES_AUTH", requires_auth: true }
];
assert.strictEqual(selectBestSource(authOnly, now).id, 8);

const unavailableOnly = [
    { id: 20, priority: 1, is_active: true, status: "TEMPORARILY_UNAVAILABLE" },
    { id: 21, priority: 2, is_active: true, status: "UNKNOWN" }
];
assert.strictEqual(selectBestSource(unavailableOnly, now), null);

assert.strictEqual(selectBestSource([], now), null);

console.log("accessPolicy tests passed");
