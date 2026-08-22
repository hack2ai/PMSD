const pool = require("../config/db");
const lectureModel = require("../models/lectureModel");
const lectureProgressModel = require("../models/lectureProgressModel");

const ensureEnrollment = async (user, courseId) => {
    if (["admin", "instructor"].includes(user.role)) return true;

    const result = await pool.query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
        [user.id, courseId]
    );
    return result.rowCount > 0;
};

const getLectureProgress = async (req, res) => {
    try {
        const lecture = await lectureModel.getLectureById(req.params.lectureId);
        if (!lecture) return res.status(404).json({ success: false, message: "Lecture not found." });
        if (!(await ensureEnrollment(req.user, lecture.course_id))) {
            return res.status(403).json({ success: false, message: "You are not enrolled in this course." });
        }

        const progress = await lectureProgressModel.getProgress(req.user.id, lecture.id);
        return res.status(200).json({
            success: true,
            progress: progress || {
                progress_seconds: 0,
                completed: false,
                last_accessed_at: null,
                completed_at: null
            }
        });
    } catch (error) {
        console.error("getLectureProgress error:", error);
        return res.status(500).json({ success: false, message: "Unable to load lecture progress." });
    }
};

const updateLectureProgress = async (req, res) => {
    try {
        const lecture = await lectureModel.getLectureById(req.params.lectureId);
        if (!lecture) return res.status(404).json({ success: false, message: "Lecture not found." });
        if (!(await ensureEnrollment(req.user, lecture.course_id))) {
            return res.status(403).json({ success: false, message: "You are not enrolled in this course." });
        }

        const seconds = Number(req.body.progress_seconds);
        const completed = Boolean(req.body.completed);
        if (!Number.isInteger(seconds) || seconds < 0) {
            return res.status(400).json({ success: false, message: "progress_seconds must be a non-negative integer." });
        }

        const progress = await lectureProgressModel.upsertProgress(req.user.id, lecture.id, seconds, completed);
        return res.status(200).json({ success: true, message: "Lecture progress saved.", progress });
    } catch (error) {
        console.error("updateLectureProgress error:", error);
        return res.status(500).json({ success: false, message: "Unable to save lecture progress." });
    }
};

const getCourseProgress = async (req, res) => {
    try {
        if (!(await ensureEnrollment(req.user, req.params.courseId))) {
            return res.status(403).json({ success: false, message: "You are not enrolled in this course." });
        }

        const progress = await lectureProgressModel.getCourseProgress(req.user.id, req.params.courseId);
        const continueLecture = await lectureProgressModel.getContinueLecture(req.user.id, req.params.courseId);

        return res.status(200).json({
            success: true,
            progress: {
                ...progress,
                continueLecture
            }
        });
    } catch (error) {
        console.error("getCourseProgress error:", error);
        return res.status(500).json({ success: false, message: "Unable to load course progress." });
    }
};

module.exports = {
    getLectureProgress,
    updateLectureProgress,
    getCourseProgress
};
