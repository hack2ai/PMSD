const {
    createPayment,
    getUserPayments,
    getAllPayments,
    updatePaymentStatus,
    deletePayment
} = require("../models/paymentModel");

const { getCourseById } = require("../models/courseModel");

const ALLOWED_PAYMENT_METHODS = new Set([
    "CARD",
    "UPI",
    "NET_BANKING",
    "BANK_TRANSFER",
    "CASH",
    "OTHER"
]);

const makePayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id, amount, payment_method } = req.body;

        if (!course_id || amount === undefined || amount === null || !payment_method) {
            return res.status(400).json({
                success: false,
                message: "Course, amount and payment method are required."
            });
        }

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a positive number."
            });
        }

        const normalizedMethod = String(payment_method).trim().toUpperCase();
        if (!ALLOWED_PAYMENT_METHODS.has(normalizedMethod)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported payment method."
            });
        }

        const course = await getCourseById(course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found."
            });
        }

        // This endpoint records a payment intent. It must not claim a real
        // gateway payment succeeded without a verified provider callback.
        const paymentReference = `PENDING-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const payment = await createPayment(
            userId,
            course_id,
            Number(numericAmount.toFixed(2)),
            normalizedMethod,
            "Pending",
            paymentReference
        );

        return res.status(202).json({
            success: true,
            code: "PAYMENT_PENDING",
            message: "Payment request recorded and is awaiting confirmation.",
            payment
        });
    } catch (err) {
        console.error("makePayment error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to record payment request."
        });
    }
};

const myPayments = async (req, res) => {
    try {
        const payments = await getUserPayments(req.user.id);
        return res.status(200).json({
            success: true,
            total: payments.length,
            payments
        });
    } catch (err) {
        console.error("myPayments error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to load your payments."
        });
    }
};

const allPayments = async (req, res) => {
    try {
        const payments = await getAllPayments();
        return res.status(200).json({
            success: true,
            total: payments.length,
            payments
        });
    } catch (err) {
        console.error("allPayments error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to load payments."
        });
    }
};

const changePaymentStatus = async (req, res) => {
    try {
        const allowedStatuses = new Set(["Pending", "Paid", "Failed", "Cancelled", "Refunded"]);
        const paymentStatus = String(req.body.payment_status || "").trim();

        if (!allowedStatuses.has(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status."
            });
        }

        const payment = await updatePaymentStatus(req.params.id, paymentStatus);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully.",
            payment
        });
    } catch (err) {
        console.error("changePaymentStatus error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to update payment status."
        });
    }
};

const removePayment = async (req, res) => {
    try {
        const payment = await deletePayment(req.params.id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment deleted successfully."
        });
    } catch (err) {
        console.error("removePayment error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to delete payment."
        });
    }
};

module.exports = {
    makePayment,
    myPayments,
    allPayments,
    changePaymentStatus,
    removePayment
};
