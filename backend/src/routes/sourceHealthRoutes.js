const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const isContentAdmin = require("../middleware/contentAdminMiddleware");
const sourceHealthController = require("../controllers/sourceHealthController");

const router = express.Router();

router.post(
    "/sources/:sourceId/check",
    authenticate,
    isContentAdmin,
    sourceHealthController.checkSourceHealth
);

module.exports = router;
