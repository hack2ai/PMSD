const assert = require("assert");
const { checkDatabase } = require("../src/utils/healthCheck");

(async () => {
    const healthyPool = {
        query: async (sql) => {
            assert.strictEqual(sql, "SELECT 1");
            return { rows: [{ "?column?": 1 }] };
        }
    };

    assert.deepStrictEqual(
        await checkDatabase(healthyPool),
        { database: "ok" }
    );

    const failingPool = {
        query: async () => {
            throw new Error("database unavailable");
        }
    };

    await assert.rejects(
        () => checkDatabase(failingPool),
        /database unavailable/
    );

    console.log("healthCheck tests passed");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
