const express = require("express");
const router = express.Router();

const adminDashboardController = require("../controllers/adminDashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

router.get(
    "/dashboard",
    authMiddleware,
    isAdmin,
    adminDashboardController.getAdminOverview
);

module.exports = router;
