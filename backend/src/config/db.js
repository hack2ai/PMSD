const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED;

const isHostedDatabaseUrl = (value) => {
    if (!value) return false;
    try {
        const hostname = new URL(value).hostname;
        return !["localhost", "127.0.0.1", "::1"].includes(hostname);
    } catch {
        return false;
    }
};

const hostedSsl = isHostedDatabaseUrl(databaseUrl);

const poolConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        max: Number(process.env.DB_POOL_MAX || 10),
        min: Number(process.env.DB_POOL_MIN || 0),
        idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
        connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
        statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 10000),
        query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000),
        maxUses: Number(process.env.DB_MAX_USES || 7500),
        ssl: process.env.DB_SSL === "false"
            ? undefined
            : (process.env.DB_SSL === "true" || hostedSsl
                ? { rejectUnauthorized: false }
                : undefined)
    }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        max: Number(process.env.DB_POOL_MAX || 10),
        min: Number(process.env.DB_POOL_MIN || 0),
        idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
        connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
        statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 10000),
        query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000),
        maxUses: Number(process.env.DB_MAX_USES || 7500),
        ssl: process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : undefined
    };

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err.message);
});

pool
    .connect()
    .then((client) => {
        console.log("PostgreSQL connected successfully");
        client.release();
    })
    .catch((err) => {
        console.error("PostgreSQL connection error:", err.message);
    });

module.exports = pool;
