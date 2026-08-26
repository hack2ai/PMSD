require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const {
    isValidMigrationFilename,
    isNonEmptyMigration
} = require("./migrationValidation");

const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
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

const pool = new Pool(databaseUrl
    ? {
        connectionString: databaseUrl,
        max: 5,
        min: 0,
        connectionTimeoutMillis: 10000,
        ssl: process.env.DB_SSL === "false"
            ? undefined
            : (process.env.DB_SSL === "true" || hostedSsl
                ? { rejectUnauthorized: false }
                : undefined)
    }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false
    });

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const MIGRATION_LOCK_ID = 82419631;

async function run() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK_ID]);

        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id BIGSERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter((file) => file.endsWith(".sql"))
            .sort();

        for (const filename of files) {
            if (!isValidMigrationFilename(filename)) {
                throw new Error(`Invalid migration filename: ${filename}`);
            }
        }

        const appliedResult = await client.query(
            "SELECT filename FROM schema_migrations ORDER BY filename"
        );

        const applied = new Set(appliedResult.rows.map((row) => row.filename));

        for (const filename of files) {
            if (applied.has(filename)) {
                console.log(`Already applied: ${filename}`);
                continue;
            }

            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf8");
            if (!isNonEmptyMigration(sql)) {
                throw new Error(`Migration is empty: ${filename}`);
            }

            console.log(`Applying: ${filename}`);
            await client.query(sql);
            await client.query(
                "INSERT INTO schema_migrations (filename) VALUES ($1)",
                [filename]
            );
        }

        await client.query("COMMIT");
        console.log("Database migrations completed successfully.");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Database migration failed:", error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

run();
