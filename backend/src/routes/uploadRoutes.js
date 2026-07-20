const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    uploadProfileImage
} = require("../controllers/uploadController");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Upload Routes Working"
    });
});

router.post(
    "/profile",
    verifyToken,
    upload.single("profile"),
    uploadProfileImage
);

module.exports = router;