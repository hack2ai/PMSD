const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    updateCourseThumbnail
} = require("../models/courseModel");

// =======================================
// Create Course
// =======================================
const createNewCourse = async (req, res) => {

    try {

        const {
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price
        } = req.body;

        if (!title || !slug || !instructor) {

            return res.status(400).json({
                success: false,
                message: "Title, slug and instructor are required."
            });

        }

        const course = await createCourse(
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            message: "Course created successfully.",
            course
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
// Get All Courses
// =======================================
const getCourses = async (req, res) => {

    try {

        const courses = await getAllCourses();

        return res.status(200).json({
            success: true,
            total: courses.length,
            courses
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
// Get Course By ID
// =======================================
const getSingleCourse = async (req, res) => {

    try {

        const course = await getCourseById(req.params.id);

        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found."
            });

        }

        return res.status(200).json({
            success: true,
            course
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
// Update Course
// =======================================
const editCourse = async (req, res) => {

    try {

        const {
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price
        } = req.body;

        const course = await updateCourse(
            req.params.id,
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price
        );

        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Course updated successfully.",
            course
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
// Delete Course
// =======================================
const removeCourse = async (req, res) => {

    try {

        const course = await deleteCourse(req.params.id);

        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully."
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
// Upload Course Thumbnail
// =======================================
const uploadThumbnail = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Thumbnail is required."
            });

        }

        const thumbnail = `/uploads/courses/${req.file.filename}`;

        const course = await updateCourseThumbnail(
            req.params.id,
            thumbnail
        );

        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Thumbnail uploaded successfully.",
            course
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
    createNewCourse,
    getCourses,
    getSingleCourse,
    editCourse,
    removeCourse,
    uploadThumbnail
};