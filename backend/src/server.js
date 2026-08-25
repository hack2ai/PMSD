require("dotenv").config();

const { validateEnv } = require("./config/env");
const config = validateEnv();
const app = require("./app");
const pool = require("./config/db");
const { gracefulShutdown } = require("./utils/shutdown");

// Vercel executes Express as a serverless function. Do not start a
// long-lived HTTP listener there; export the Express application instead.
if (process.env.VERCEL) {
    module.exports = app;
} else {
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

        const result = await gracefulShutdown(server, pool);

        if (result.ok) {
            console.log(JSON.stringify({
                level: "info",
                event: "server_shutdown_completed",
                signal
            }));
        }

        clearTimeout(forceExit);
        process.exitCode = result.ok ? 0 : 1;
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
}
