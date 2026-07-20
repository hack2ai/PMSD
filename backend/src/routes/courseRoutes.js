const express = require("express");
const router = express.Router();

// =======================================
// Middleware
// =======================================
const verifyToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

// =======================================
// Controllers
// =======================================
const {
    createNewCourse,
    getCourses,
    getSingleCourse,
    editCourse,
    removeCourse,
    uploadThumbnail
} = require("../controllers/courseController");

// =======================================
// Public Routes
// =======================================

// Get All Courses
router.get("/", getCourses);

// Get Single Course
router.get("/:id", getSingleCourse);

// =======================================
// Admin Routes
// =======================================

// Create Course
router.post(
    "/",
    verifyToken,
    isAdmin,
    createNewCourse
);

// Update Course
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    editCourse
);

// Delete Course
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    removeCourse
);

// =======================================
// Upload Course Thumbnail
// =======================================
router.post(
    "/:id/thumbnail",
    verifyToken,
    isAdmin,
    upload.single("thumbnail"),
    (req, res) => {

        console.log("================================");
        console.log("✅ Multer Passed");
        console.log(req.file);
        console.log("================================");

        return res.status(200).json({
            success: true,
            file: req.file
        });

    }
);
// =======================================
// Export
// =======================================
module.exports = router;