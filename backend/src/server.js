require("dotenv").config();

const app = require("./app");
require("./config/db");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log("=================================");
    console.log("🚀 PMSD Backend Started");
    console.log(`🌍 http://localhost:${PORT}`);
    console.log("=================================");
});