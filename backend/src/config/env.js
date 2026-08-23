const requiredProductionVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET"
];

const validateEnv = () => {
    const nodeEnv = process.env.NODE_ENV || "development";
    const missing = requiredProductionVars.filter((name) => !process.env[name]);

    if (missing.length > 0 && nodeEnv === "production") {
        throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long.");
    }

    return {
        nodeEnv,
        port: Number(process.env.PORT || 5001),
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
    };
};

module.exports = { validateEnv };
