require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
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

async function run() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

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
