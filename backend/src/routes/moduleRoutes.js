const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const moduleController = require("../controllers/moduleController");

const router = express.Router();

router.get("/courses/:courseId/modules", authenticate, moduleController.getCourseModules);
router.post("/courses/:courseId/modules", authenticate, moduleController.createModule);
router.put("/modules/:moduleId", authenticate, moduleController.updateModule);
router.delete("/modules/:moduleId", authenticate, moduleController.deleteModule);

module.exports = router;
