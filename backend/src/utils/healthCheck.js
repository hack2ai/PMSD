const checkDatabase = async (pool) => {
    const startedAt = process.hrtime.bigint();

    await pool.query("SELECT 1");

    const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    return {
        database: "ok",
        latencyMs: Number(latencyMs.toFixed(2))
    };
};

module.exports = { checkDatabase };
