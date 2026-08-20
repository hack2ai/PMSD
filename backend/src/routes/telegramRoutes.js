const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const { importTelegramLecture } = require("../controllers/telegramController");
const { receiveTelegramWebhook } = require("../controllers/telegramWebhookController");

// Telegram calls this endpoint directly and authenticates it with the configured secret header.
router.post("/webhook", receiveTelegramWebhook);

router.post("/imports", verifyToken, isAdmin, importTelegramLecture);

module.exports = router;
