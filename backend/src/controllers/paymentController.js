const {
    createPayment,
    getPaymentById,
    getUserPayments,
    getAllPayments,
    updatePaymentStatus,
    deletePayment
} = require("../models/paymentModel");

const { getCourseById } = require("../models/courseModel");

// =======================================
// Create Payment
// =======================================
const makePayment = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            course_id,
            amount,
            payment_method
        } = req.body;

        if (!course_id || !amount || !payment_method) {

            return res.status(400).json({
                success: false,
                message: "Course, amount and payment method are required."
            });

        }

        // Check Course Exists
        const course = await getCourseById(course_id);

        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found."
            });

        }

        // Generate Fake Transaction ID
        const transactionId =
            "TXN-" +
            Date.now() +
            "-" +
            Math.floor(Math.random() * 100000);

        const payment = await createPayment(
            userId,
            course_id,
            amount,
            payment_method,
            "Paid",
            transactionId
        );

        return res.status(201).json({
            success: true,
            message: "Payment successful.",
            payment
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// My Payments
// =======================================
const myPayments = async (req, res) => {

    try {

        const payments = await getUserPayments(req.user.id);

        return res.status(200).json({
            success: true,
            total: payments.length,
            payments
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Get All Payments (Admin)
// =======================================
const allPayments = async (req, res) => {

    try {

        const payments = await getAllPayments();

        return res.status(200).json({
            success: true,
            total: payments.length,
            payments
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Update Payment Status
// =======================================
const changePaymentStatus = async (req, res) => {

    try {

        const { payment_status } = req.body;

        const payment = await updatePaymentStatus(
            req.params.id,
            payment_status
        );

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

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Delete Payment
// =======================================
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

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Export
// =======================================
module.exports = {
    makePayment,
    myPayments,
    allPayments,
    changePaymentStatus,
    removePayment
};