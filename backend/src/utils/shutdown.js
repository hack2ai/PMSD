const gracefulShutdown = (server, pool, { signal, logger = console } = {}) => new Promise((resolve) => {
    server.close(async (serverError) => {
        if (serverError) {
            logger.error(JSON.stringify({
                level: "error",
                event: "server_shutdown_error",
                error: serverError.message
            }));
        }

        try {
            await pool.end();
        } catch (dbError) {
            logger.error(JSON.stringify({
                level: "error",
                event: "database_pool_shutdown_error",
                error: dbError.message
            }));
            resolve({ ok: false, serverError, dbError });
            return;
        }

        resolve({ ok: !serverError, serverError: serverError || null });
    });
});

module.exports = { gracefulShutdown };
