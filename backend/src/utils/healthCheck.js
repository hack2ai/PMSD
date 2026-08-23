const checkDatabase = async (pool) => {
    await pool.query("SELECT 1");
    return { database: "ok" };
};

module.exports = { checkDatabase };
