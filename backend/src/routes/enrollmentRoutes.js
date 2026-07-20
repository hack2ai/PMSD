const express = require("express");
const router = express.Router();

// =======================================
// Middleware
// =======================================
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

// =======================================
// Controllers
// =======================================
const {
    enrollCourse,
    myEnrollments,
    allEnrollments,
    removeEnrollment
} = require("../controllers/enrollmentController");

// =======================================
// User Routes
// =======================================

// Enroll in Course
// POST /api/enrollments
router.post(
    "/",
    verifyToken,
    enrollCourse
);

// My Enrollments
// GET /api/enrollments/my
router.get(
    "/my",
    verifyToken,
    myEnrollments
);

// =======================================
// Admin Routes
// =======================================

// Get All Enrollments
// GET /api/enrollments
router.get(
    "/",
    verifyToken,
    isAdmin,
    allEnrollments
);

// Delete Enrollment
// DELETE /api/enrollments/:id
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    removeEnrollment
);

// =======================================
// Export
// =======================================
module.exports = router;