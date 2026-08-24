require("dotenv").config();

const { validateEnv } = require("./config/env");
const config = validateEnv();
const app = require("./app");
const pool = require("./config/db");

const server = app.listen(config.port, "0.0.0.0", () => {
    console.log("=================================");
    console.log("PMSD Backend Started");
    console.log(`Listening on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log("=================================");
});

server.on("error", (error) => {
    console.error(JSON.stringify({
        level: "error",
        event: "server_startup_error",
        error: error.message
    }));
    process.exitCode = 1;
});

let shuttingDown = false;

const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(JSON.stringify({
        level: "info",
        event: "server_shutdown_started",
        signal
    }));

    const forceExit = setTimeout(() => {
        console.error(JSON.stringify({
            level: "error",
            event: "server_shutdown_timeout",
            signal
        }));
        process.exit(1);
    }, 15000);
    forceExit.unref();

    server.close(async (serverError) => {
        if (serverError) {
            console.error(JSON.stringify({
                level: "error",
                event: "server_shutdown_error",
                error: serverError.message
            }));
        }

        try {
            await pool.end();
            console.log(JSON.stringify({
                level: "info",
                event: "server_shutdown_completed",
                signal
            }));
            clearTimeout(forceExit);
            process.exitCode = serverError ? 1 : 0;
        } catch (dbError) {
            console.error(JSON.stringify({
                level: "error",
                event: "database_pool_shutdown_error",
                error: dbError.message
            }));
            clearTimeout(forceExit);
            process.exitCode = 1;
        }
    });
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
