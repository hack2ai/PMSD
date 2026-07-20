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
    generateCertificate,
    myCertificates,
    allCertificates,
    verifyCertificate,
    removeCertificate
} = require("../controllers/certificateController");

// =======================================
// Student Routes
// =======================================

// Generate Certificate
// POST /api/certificates
router.post(
    "/",
    verifyToken,
    generateCertificate
);

// My Certificates
// GET /api/certificates/my
router.get(
    "/my",
    verifyToken,
    myCertificates
);

// =======================================
// Public Route
// =======================================

// Verify Certificate
// GET /api/certificates/verify/:number
router.get(
    "/verify/:number",
    verifyCertificate
);

// =======================================
// Admin Routes
// =======================================

// Get All Certificates
// GET /api/certificates
router.get(
    "/",
    verifyToken,
    isAdmin,
    allCertificates
);

// Delete Certificate
// DELETE /api/certificates/:id
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    removeCertificate
);

// =======================================
// Export
// =======================================
module.exports = router;