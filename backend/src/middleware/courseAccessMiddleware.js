const pool = require("../config/db");
const verifyToken = require("./authMiddleware");

const requireCourseEnrollment = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const result = await pool.query(
            `SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
            [req.user.id, courseId]
        );

        if (result.rowCount === 0 && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "You do not have access to this course." });
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = [verifyToken, requireCourseEnrollment];
