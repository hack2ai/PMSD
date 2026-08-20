const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const { createSource, getSources, registerWebhook } = require("../controllers/telegramSourceController");

router.use(verifyToken, isAdmin);
router.get("/sources", getSources);
router.post("/sources", createSource);
router.post("/webhook/register", registerWebhook);

module.exports = router;
