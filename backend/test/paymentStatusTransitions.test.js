const assert = require("assert");

const transitions = {
    Pending: new Set(["Paid", "Failed", "Cancelled"]),
    Paid: new Set(["Refunded"]),
    Failed: new Set(),
    Cancelled: new Set(),
    Refunded: new Set()
};

const canTransition = (from, to) => Boolean(transitions[from]?.has(to));

// Allowed transitions
assert.strictEqual(canTransition("Pending", "Paid"), true);
assert.strictEqual(canTransition("Pending", "Failed"), true);
assert.strictEqual(canTransition("Pending", "Cancelled"), true);
assert.strictEqual(canTransition("Paid", "Refunded"), true);

// Forbidden transitions
for (const [from, forbidden] of [
    ["Paid", "Pending"],
    ["Paid", "Failed"],
    ["Paid", "Cancelled"],
    ["Failed", "Pending"],
    ["Failed", "Paid"],
    ["Cancelled", "Pending"],
    ["Refunded", "Paid"],
    ["Refunded", "Pending"]
]) {
    assert.strictEqual(canTransition(from, forbidden), false, `${from} -> ${forbidden} must be rejected`);
}

// Unknown states must never transition.
assert.strictEqual(canTransition("Unknown", "Paid"), false);
assert.strictEqual(canTransition("Pending", "Unknown"), false);

console.log("paymentStatusTransitions tests passed");
