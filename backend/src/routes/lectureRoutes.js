const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const lectureController = require("../controllers/lectureController");

const router = express.Router();

router.get("/modules/:moduleId/lectures", authenticate, lectureController.getModuleLectures);
router.post("/modules/:moduleId/lectures", authenticate, lectureController.createLecture);
router.get("/lectures/:lectureId", authenticate, lectureController.getLecture);
router.put("/lectures/:lectureId", authenticate, lectureController.updateLecture);
router.delete("/lectures/:lectureId", authenticate, lectureController.deleteLecture);

module.exports = router;
