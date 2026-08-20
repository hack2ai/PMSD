const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const courseAccess = require("../middleware/courseAccessMiddleware");
const { verifyLectureAccess } = require("../middleware/lectureAccessMiddleware");
const {
    listCourseLectures,
    listCourseModules,
    createCourseModule,
    createNewLecture,
    getLectureAccess,
    streamLecture
} = require("../controllers/lectureController");

router.get("/course/:courseId", ...courseAccess, listCourseLectures);
router.get("/course/:courseId/modules", ...courseAccess, listCourseModules);

router.post("/course/:courseId/modules", verifyToken, isAdmin, createCourseModule);
router.post("/modules/:moduleId/lectures", verifyToken, isAdmin, createNewLecture);

router.get("/:id/access", ...verifyLectureAccess, getLectureAccess);
router.get("/:id/stream", ...verifyLectureAccess, streamLecture);

module.exports = router;
