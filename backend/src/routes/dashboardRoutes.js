const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

// =======================================
// Dashboard Summary
// GET /api/dashboard
// =======================================
router.get(
    "/",
    authMiddleware,
    dashboardController.getDashboard
);

// =======================================
// My Enrolled Courses
// GET /api/dashboard/my-courses
// =======================================
router.get(
    "/my-courses",
    authMiddleware,
    dashboardController.getMyCourses
);

// =======================================
// My Certificates
// GET /api/dashboard/my-certificates
// =======================================
router.get(
    "/my-certificates",
    authMiddleware,
    dashboardController.getMyCertificates
);

// =======================================
// Payment History
// GET /api/dashboard/payment-history
// =======================================
router.get(
    "/payment-history",
    authMiddleware,
    dashboardController.getPaymentHistory
);

module.exports = router;