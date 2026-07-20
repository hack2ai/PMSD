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
    getMyProfile,
    updateMyProfile,
    getUsers
} = require("../controllers/userController");

// =======================================
// Get Logged-in User
// GET /api/users/me
// =======================================
router.get(
    "/me",
    verifyToken,
    getMyProfile
);

// =======================================
// Update Logged-in User
// PUT /api/users/me
// =======================================
router.put(
    "/me",
    verifyToken,
    updateMyProfile
);

// =======================================
// Get All Users (Admin)
// GET /api/users
// =======================================
router.get(
    "/",
    verifyToken,
    isAdmin,
    getUsers
);

// =======================================
// Export
// =======================================
module.exports = router;