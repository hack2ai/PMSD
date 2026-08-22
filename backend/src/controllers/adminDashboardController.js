const pool = require("../config/db");

const getAdminOverview = async (req, res) => {
    try {
        const [users, courses, enrollments, publishedLectures, accessToday, deniedToday, activeSources, unavailableSources, recentAudit] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS total FROM users`),
            pool.query(`SELECT COUNT(*)::int AS total FROM courses`),
            pool.query(`SELECT COUNT(*)::int AS total FROM enrollments`),
            pool.query(`SELECT COUNT(*)::int AS total FROM lectures WHERE status = 'PUBLISHED'`),
            pool.query(`SELECT COUNT(*)::int AS total FROM access_attempts WHERE attempted_at >= CURRENT_DATE`),
            pool.query(`SELECT COUNT(*)::int AS total FROM access_attempts WHERE attempted_at >= CURRENT_DATE AND status = 'DENIED'`),
            pool.query(`SELECT COUNT(*)::int AS total FROM lecture_sources WHERE is_active = TRUE`),
            pool.query(`SELECT COUNT(*)::int AS total FROM lecture_sources WHERE is_active = TRUE AND status IN ('TEMPORARILY_UNAVAILABLE', 'UNKNOWN')`),
            pool.query(`SELECT id, action, outcome, reason, lecture_id, source_id, created_at FROM audit_log ORDER BY created_at DESC LIMIT 8`)
        ]);

        return res.status(200).json({
            success: true,
            overview: {
                users: users.rows[0].total,
                courses: courses.rows[0].total,
                enrollments: enrollments.rows[0].total,
                publishedLectures: publishedLectures.rows[0].total,
                accessToday: accessToday.rows[0].total,
                deniedToday: deniedToday.rows[0].total,
                activeSources: activeSources.rows[0].total,
                unavailableSources: unavailableSources.rows[0].total,
                recentAudit: recentAudit.rows
            }
        });
    } catch (error) {
        console.error("getAdminOverview error:", error);
        return res.status(500).json({ success: false, message: "Unable to load admin overview." });
    }
};

module.exports = { getAdminOverview };
