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
    makePayment,
    myPayments,
    allPayments,
    changePaymentStatus,
    removePayment
} = require("../controllers/paymentController");

// =======================================
// User Routes
// =======================================

// Make Payment
// POST /api/payments
router.post(
    "/",
    verifyToken,
    makePayment
);

// My Payments
// GET /api/payments/my
router.get(
    "/my",
    verifyToken,
    myPayments
);

// =======================================
// Admin Routes
// =======================================

// Get All Payments
// GET /api/payments
router.get(
    "/",
    verifyToken,
    isAdmin,
    allPayments
);

// Update Payment Status
// PUT /api/payments/:id/status
router.put(
    "/:id/status",
    verifyToken,
    isAdmin,
    changePaymentStatus
);

// Delete Payment
// DELETE /api/payments/:id
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    removePayment
);

// =======================================
// Export
// =======================================
module.exports = router;