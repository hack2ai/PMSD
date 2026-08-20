const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const [enrolledCourses, certificates, payments, learning] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS total FROM enrollments WHERE user_id = $1`, [userId]),
            pool.query(`SELECT COUNT(*) AS total FROM certificates WHERE user_id = $1`, [userId]),
            pool.query(`SELECT COUNT(*) AS total FROM payments WHERE user_id = $1 AND payment_status = 'completed'`, [userId]),
            pool.query(`
                SELECT
                    COUNT(l.id)::int AS total_lectures,
                    COUNT(l.id) FILTER (WHERE lp.completed)::int AS completed_lectures,
                    COALESCE(SUM(lp.watched_seconds), 0)::int AS watched_seconds
                FROM enrollments e
                JOIN course_modules m ON m.course_id = e.course_id
                JOIN lectures l ON l.module_id = m.id AND l.status = 'published'
                LEFT JOIN lecture_progress lp ON lp.lecture_id = l.id AND lp.user_id = e.user_id
                WHERE e.user_id = $1
            `, [userId])
        ]);

        const stats = learning.rows[0];
        const totalLectures = Number(stats.total_lectures || 0);
        const completedLectures = Number(stats.completed_lectures || 0);

        res.json({
            success: true,
            dashboard: {
                enrolledCourses: Number(enrolledCourses.rows[0].total),
                certificates: Number(certificates.rows[0].total),
                payments: Number(payments.rows[0].total),
                totalLectures,
                completedLectures,
                learningPercent: totalLectures ? Math.round((completedLectures / totalLectures) * 100) : 0,
                watchedSeconds: Number(stats.watched_seconds || 0)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Dashboard loading failed" });
    }
};

exports.getMyCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT
                c.id,
                c.title,
                c.description,
                c.price,
                c.thumbnail,
                c.instructor,
                e.enrolled_at,
                COUNT(l.id)::int AS total_lectures,
                COUNT(l.id) FILTER (WHERE lp.completed)::int AS completed_lectures,
                COALESCE(SUM(lp.watched_seconds), 0)::int AS watched_seconds
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            LEFT JOIN course_modules m ON m.course_id = c.id
            LEFT JOIN lectures l ON l.module_id = m.id AND l.status = 'published'
            LEFT JOIN lecture_progress lp ON lp.lecture_id = l.id AND lp.user_id = e.user_id
            WHERE e.user_id = $1
            GROUP BY c.id, e.enrolled_at
            ORDER BY e.enrolled_at DESC
        `, [userId]);

        const courses = result.rows.map((course) => ({
            ...course,
            total_lectures: Number(course.total_lectures),
            completed_lectures: Number(course.completed_lectures),
            watched_seconds: Number(course.watched_seconds),
            progress_percent: Number(course.total_lectures)
                ? Math.round((Number(course.completed_lectures) / Number(course.total_lectures)) * 100)
                : 0
        }));

        res.json({ success: true, totalCourses: courses.length, courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch courses" });
    }
};

exports.getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT c.id, c.certificate_number, c.certificate_url, c.issued_at,
                   co.title AS course_title
            FROM certificates c
            JOIN courses co ON c.course_id = co.id
            WHERE c.user_id = $1
            ORDER BY c.issued_at DESC
        `, [userId]);

        res.json({ success: true, totalCertificates: result.rows.length, certificates: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch certificates" });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT p.id, p.amount, p.payment_method, c.title AS course_title
            FROM payments p
            JOIN courses c ON p.course_id = c.id
            WHERE p.user_id = $1
            ORDER BY p.id DESC
        `, [userId]);

        res.json({ success: true, totalPayments: result.rows.length, payments: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch payment history" });
    }
};
