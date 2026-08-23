const assert = require("assert");
const {
    isValidMigrationFilename,
    isNonEmptyMigration
} = require("../database/migrationValidation");

assert.strictEqual(isValidMigrationFilename("001_initial_schema.sql"), true);
assert.strictEqual(isValidMigrationFilename("012_add_payment_status.sql"), true);
assert.strictEqual(isValidMigrationFilename("1_initial_schema.sql"), false);
assert.strictEqual(isValidMigrationFilename("001 Initial Schema.sql"), false);
assert.strictEqual(isValidMigrationFilename("001_initial_schema.txt"), false);
assert.strictEqual(isValidMigrationFilename("001_DROP_users.sql"), false);
assert.strictEqual(isValidMigrationFilename("001_.sql"), false);

assert.strictEqual(isNonEmptyMigration("CREATE TABLE example (id INT);"), true);
assert.strictEqual(isNonEmptyMigration("  -- migration comment\n  "), false);
assert.strictEqual(isNonEmptyMigration(""), false);
assert.strictEqual(isNonEmptyMigration(null), false);

console.log("migrationValidation tests passed");
