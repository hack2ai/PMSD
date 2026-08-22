const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const {
    getLectureProgress,
    updateLectureProgress,
    getCourseProgress
} = require("../controllers/lectureProgressController");

const router = express.Router();

router.get("/lectures/:lectureId", authenticate, getLectureProgress);
router.post("/lectures/:lectureId", authenticate, updateLectureProgress);
router.get("/courses/:courseId", authenticate, getCourseProgress);

module.exports = router;
