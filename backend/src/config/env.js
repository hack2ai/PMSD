const requiredProductionVars = ["JWT_SECRET"];

const hasDatabaseConfiguration = () => Boolean(
    process.env.DATABASE_URL || (
        process.env.DB_HOST &&
        process.env.DB_PORT &&
        process.env.DB_USER &&
        process.env.DB_PASSWORD &&
        process.env.DB_NAME
    )
);

const isValidPort = (value) => {
    if (value === undefined || value === null || value === "") return false;
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535;
};

const validateEnv = () => {
    const nodeEnv = process.env.NODE_ENV || "development";
    const missing = requiredProductionVars.filter((name) => !process.env[name]);

    if (nodeEnv === "production" && !hasDatabaseConfiguration()) {
        missing.push("DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME");
    }

    if (missing.length > 0 && nodeEnv === "production") {
        throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long.");
    }

    if (process.env.DB_PORT && !isValidPort(process.env.DB_PORT)) {
        throw new Error("DB_PORT must be an integer between 1 and 65535.");
    }

    if (process.env.PORT && !isValidPort(process.env.PORT)) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }

    const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (process.env.VERCEL_URL) {
        configuredOrigins.push(`https://${process.env.VERCEL_URL}`);
    }

    const uniqueOrigins = [...new Set(configuredOrigins)];

    if (nodeEnv === "production" && uniqueOrigins.length === 0) {
        throw new Error("CORS_ORIGINS or FRONTEND_URL is required in production outside Vercel.");
    }

    if (nodeEnv === "production" && uniqueOrigins.some((origin) => origin === "*")) {
        throw new Error("Wildcard CORS origin is not allowed in production.");
    }

    return {
        nodeEnv,
        port: Number(process.env.PORT || 5001),
        frontendUrl: process.env.FRONTEND_URL || uniqueOrigins[0] || "http://localhost:5173",
        corsOrigins: uniqueOrigins.length > 0
            ? uniqueOrigins
            : ["http://localhost:5173"]
    };
};

module.exports = { validateEnv, isValidPort };
