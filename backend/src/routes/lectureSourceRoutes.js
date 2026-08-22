const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const isContentAdmin = require("../middleware/contentAdminMiddleware");
const lectureSourceController = require("../controllers/lectureSourceController");

const router = express.Router();

router.use(authenticate);

// Students may inspect source availability metadata, but not raw source URLs.
router.get("/lectures/:lectureId/sources", lectureSourceController.getLectureSources);

// Only instructors/admins can register or manage approved sources.
router.post("/lectures/:lectureId/sources", isContentAdmin, lectureSourceController.createSource);
router.patch("/sources/:sourceId/status", isContentAdmin, lectureSourceController.updateSourceStatus);
router.delete("/sources/:sourceId", isContentAdmin, lectureSourceController.deactivateSource);

module.exports = router;
