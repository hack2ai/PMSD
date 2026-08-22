const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const { listAuditLogsController } = require("../controllers/auditController");

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

router.get("/", listAuditLogsController);

module.exports = router;
