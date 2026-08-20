const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const courseAccess = require("../middleware/courseAccessMiddleware");
const { verifyLectureAccess } = require("../middleware/lectureAccessMiddleware");
const streamSession = require("../middleware/streamSessionMiddleware");
const {
    listCourseLectures,
    listCourseModules,
    createCourseModule,
    createNewLecture,
    getLectureAccess,
    saveLectureProgress,
    listSecuritySessions,
    revokeSecuritySession,
    streamLecture
} = require("../controllers/lectureController");

router.get("/course/:courseId", ...courseAccess, listCourseLectures);
router.get("/course/:courseId/modules", ...courseAccess, listCourseModules);

router.post("/course/:courseId/modules", verifyToken, isAdmin, createCourseModule);
router.post("/modules/:moduleId/lectures", verifyToken, isAdmin, createNewLecture);

router.get("/security/sessions", verifyToken, isAdmin, listSecuritySessions);
router.post("/security/sessions/:sessionId/revoke", verifyToken, isAdmin, revokeSecuritySession);

router.get("/:id/access", ...verifyLectureAccess, getLectureAccess);
router.post("/:id/progress", verifyToken, saveLectureProgress);
router.get("/:id/stream", ...streamSession, streamLecture);

module.exports = router;
