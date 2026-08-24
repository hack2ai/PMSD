const assert = require("assert");

const originalEnv = { ...process.env };
const { validateEnv } = require("../src/config/env");

const resetEnv = () => {
    for (const key of Object.keys(process.env)) {
        delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
};

const setProductionEnv = (overrides = {}) => {
    resetEnv();
    Object.assign(process.env, {
        NODE_ENV: "production",
        DB_HOST: "db",
        DB_PORT: "5432",
        DB_USER: "pmsd",
        DB_PASSWORD: "strong-password",
        DB_NAME: "pmsd",
        JWT_SECRET: "abcdefghijklmnopqrstuvwxyz123456",
        PORT: "5000",
        FRONTEND_URL: "https://app.example.com",
        CORS_ORIGINS: "https://app.example.com",
        ...overrides
    });
};

try {
    setProductionEnv();
    const config = validateEnv();
    assert.strictEqual(config.nodeEnv, "production");
    assert.strictEqual(config.port, 5000);
    assert.deepStrictEqual(config.corsOrigins, ["https://app.example.com"]);

    setProductionEnv({ DB_PORT: "not-a-port" });
    assert.throws(() => validateEnv(), /DB_PORT/);

    setProductionEnv({ PORT: "70000" });
    assert.throws(() => validateEnv(), /PORT/);

    setProductionEnv({ CORS_ORIGINS: "*" });
    assert.throws(() => validateEnv(), /CORS/);

    setProductionEnv({ DB_PASSWORD: "" });
    assert.throws(() => validateEnv(), /DB_PASSWORD/);

    setProductionEnv({ JWT_SECRET: "short" });
    assert.throws(() => validateEnv(), /JWT_SECRET/);

    console.log("env tests passed");
} finally {
    resetEnv();
}
