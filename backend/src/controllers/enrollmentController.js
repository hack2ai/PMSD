const {
    createEnrollment,
    findEnrollment,
    getUserEnrollments,
    getAllEnrollments,
    deleteEnrollment
} = require("../models/enrollmentModel");

const { getCourseById } = require("../models/courseModel");

const enrollCourse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required."
            });
        }

        const course = await getCourseById(course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found."
            });
        }

        const existing = await findEnrollment(userId, course_id);
        if (existing) {
            return res.status(409).json({
                success: false,
                code: "ALREADY_ENROLLED",
                message: "You are already enrolled in this course.",
                enrollment: existing
            });
        }

        const enrollment = await createEnrollment(userId, course_id);

        // Handles a race where another request inserts the same enrollment
        // after the pre-check but before this insert.
        if (!enrollment) {
            const concurrentEnrollment = await findEnrollment(userId, course_id);
            return res.status(409).json({
                success: false,
                code: "ALREADY_ENROLLED",
                message: "You are already enrolled in this course.",
                enrollment: concurrentEnrollment || null
            });
        }

        return res.status(201).json({
            success: true,
            message: "Course enrolled successfully.",
            enrollment
        });
    } catch (err) {
        console.error("enrollCourse error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to enroll in course right now."
        });
    }
};

const myEnrollments = async (req, res) => {
    try {
        const enrollments = await getUserEnrollments(req.user.id);
        return res.status(200).json({
            success: true,
            total: enrollments.length,
            enrollments
        });
    } catch (err) {
        console.error("myEnrollments error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to load your enrollments."
        });
    }
};

const allEnrollments = async (req, res) => {
    try {
        const enrollments = await getAllEnrollments();
        return res.status(200).json({
            success: true,
            total: enrollments.length,
            enrollments
        });
    } catch (err) {
        console.error("allEnrollments error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to load enrollments."
        });
    }
};

const removeEnrollment = async (req, res) => {
    try {
        const enrollment = await deleteEnrollment(req.params.id);
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Enrollment deleted successfully."
        });
    } catch (err) {
        console.error("removeEnrollment error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to delete enrollment."
        });
    }
};

module.exports = {
    enrollCourse,
    myEnrollments,
    allEnrollments,
    removeEnrollment
};
