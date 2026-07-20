const {
    createEnrollment,
    findEnrollment,
    getUserEnrollments,
    getAllEnrollments,
    deleteEnrollment
} = require("../models/enrollmentModel");

const { getCourseById } = require("../models/courseModel");

// =======================================
// Enroll in Course
// =======================================
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

        // Check Course Exists
        const course = await getCourseById(course_id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found."
            });
        }

        // Check Already Enrolled
        const alreadyEnrolled = await findEnrollment(
            userId,
            course_id
        );

        if (alreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: "You are already enrolled in this course."
            });
        }

        const enrollment = await createEnrollment(
            userId,
            course_id
        );

        return res.status(201).json({
            success: true,
            message: "Course enrolled successfully.",
            enrollment
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
// My Enrollments
// =======================================
const myEnrollments = async (req, res) => {

    try {

        const enrollments = await getUserEnrollments(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            total: enrollments.length,
            enrollments
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
// All Enrollments (Admin)
// =======================================
const allEnrollments = async (req, res) => {

    try {

        const enrollments = await getAllEnrollments();

        return res.status(200).json({
            success: true,
            total: enrollments.length,
            enrollments
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
// Delete Enrollment
// =======================================
const removeEnrollment = async (req, res) => {

    try {

        const enrollment = await deleteEnrollment(
            req.params.id
        );

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
    enrollCourse,
    myEnrollments,
    allEnrollments,
    removeEnrollment
};