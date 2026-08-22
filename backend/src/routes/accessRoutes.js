const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const { requestLectureAccess } = require("../controllers/accessController");

const router = express.Router();

router.post("/lectures/:lectureId/access", authenticate, requestLectureAccess);

module.exports = router;
