const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const lectureAccessRateLimit = require("../middleware/lectureAccessRateLimit");
const { requestLectureAccess } = require("../controllers/accessController");

const router = express.Router();

router.post(
    "/lectures/:lectureId/access",
    authenticate,
    lectureAccessRateLimit,
    requestLectureAccess
);

module.exports = router;
