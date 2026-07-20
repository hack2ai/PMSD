const pool = require("../config/db");

// =======================================
// Dashboard Summary
// =======================================
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrolledCourses = await pool.query(
            `SELECT COUNT(*) AS total
             FROM enrollments
             WHERE user_id = $1`,
            [userId]
        );

        const certificates = await pool.query(
            `SELECT COUNT(*) AS total
             FROM certificates
             WHERE user_id = $1`,
            [userId]
        );

        const payments = await pool.query(
            `SELECT COUNT(*) AS total
             FROM payments
             WHERE user_id = $1
             AND payment_status = 'completed'`,
            [userId]
        );

        res.json({
            success: true,
            dashboard: {
                enrolledCourses: Number(enrolledCourses.rows[0].total),
                certificates: Number(certificates.rows[0].total),
                payments: Number(payments.rows[0].total)
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Dashboard loading failed"
        });

    }
};

// =======================================
// My Courses
// =======================================
exports.getMyCourses = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `
            SELECT
                c.id,
                c.title,
                c.description,
                c.price,
                c.thumbnail,
                c.instructor,
                e.enrolled_at
            FROM enrollments e
            JOIN courses c
                ON e.course_id = c.id
            WHERE e.user_id = $1
            ORDER BY e.enrolled_at DESC
            `,
            [userId]
        );

        res.json({
            success: true,
            totalCourses: result.rows.length,
            courses: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch courses"
        });

    }
};

// =======================================
// My Certificates
// =======================================
exports.getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `
            SELECT
                c.id,
                c.certificate_number,
                c.certificate_url,
                c.issued_at,
                co.title AS course_title
            FROM certificates c
            JOIN courses co
                ON c.course_id = co.id
            WHERE c.user_id = $1
            ORDER BY c.issued_at DESC
            `,
            [userId]
        );

        res.json({
            success: true,
            totalCertificates: result.rows.length,
            certificates: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch certificates"
        });

    }
};

// =======================================
// Payment History
// =======================================
exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.amount,
                p.payment_method,
                c.title AS course_title
            FROM payments p
            JOIN courses c
                ON p.course_id = c.id
            WHERE p.user_id = $1
            ORDER BY p.id DESC
            `,
            [userId]
        );

        res.json({
            success: true,
            totalPayments: result.rows.length,
            payments: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch payment history"
        });

    }
};