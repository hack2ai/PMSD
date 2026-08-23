const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/live", (req, res) => {
    res.status(200).json({
        success: true,
        status: "alive",
        requestId: req.requestId
    });
});

router.get("/ready", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            success: true,
            status: "ready",
            checks: {
                database: "ok"
            },
            requestId: req.requestId
        });
    } catch (error) {
        console.error(JSON.stringify({
            level: "error",
            event: "readiness_check_failed",
            requestId: req.requestId,
            dependency: "database",
            error: error.message
        }));

        return res.status(503).json({
            success: false,
            status: "not_ready",
            checks: {
                database: "unavailable"
            },
            requestId: req.requestId
        });
    }
});

module.exports = router;
