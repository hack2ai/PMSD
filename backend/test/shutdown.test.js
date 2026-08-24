const assert = require("assert");
const { gracefulShutdown } = require("../src/utils/shutdown");

(async () => {
    const events = [];
    const server = {
        close(callback) {
            events.push("server.close");
            callback();
        }
    };
    const pool = {
        async end() {
            events.push("pool.end");
        }
    };

    const result = await gracefulShutdown(server, pool);
    assert.deepStrictEqual(result, { ok: true, serverError: null });
    assert.deepStrictEqual(events, ["server.close", "pool.end"]);

    const failingPool = {
        async end() {
            throw new Error("pool close failed");
        }
    };

    const failed = await gracefulShutdown(
        server,
        failingPool,
        { logger: { error() {} } }
    );

    assert.strictEqual(failed.ok, false);
    assert.match(failed.dbError.message, /pool close failed/);

    console.log("shutdown tests passed");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
