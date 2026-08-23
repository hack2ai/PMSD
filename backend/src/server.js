require("dotenv").config();

const { validateEnv } = require("./config/env");
const config = validateEnv();
const app = require("./app");
require("./config/db");

app.listen(config.port, () => {
    console.log("=================================");
    console.log("🚀 PMSD Backend Started");
    console.log(`🌍 http://localhost:${config.port}`);
    console.log(`🔐 Environment: ${config.nodeEnv}`);
    console.log("=================================");
});
