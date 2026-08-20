const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const { importTelegramLecture } = require("../controllers/telegramController");

router.post("/imports", verifyToken, isAdmin, importTelegramLecture);

module.exports = router;
