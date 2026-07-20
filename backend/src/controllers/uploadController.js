const pool = require("../config/db");

// =======================================
// Upload Profile Image
// =======================================
const uploadProfileImage = async (req, res) => {

    console.log("================================");
    console.log("🚀 uploadProfileImage() HIT");
    console.log("================================");

    console.log("👤 User:");
    console.log(req.user);

    console.log("📁 File:");
    console.log(req.file);

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded."
            });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated."
            });
        }

        const imagePath = "/uploads/profiles/" + req.file.filename;

        console.log("Image Path:", imagePath);

        const result = await pool.query(
            `
            UPDATE users
            SET profile_image = $1
            WHERE id = $2
            RETURNING
                id,
                full_name,
                email,
                role,
                profile_image;
            `,
            [imagePath, req.user.id]
        );

        console.log("Database Result:", result.rows);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully.",
            user: result.rows[0]
        });

    } catch (err) {

        console.error("Upload Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =======================================
// Upload Course Thumbnail
// =======================================
const uploadCourseThumbnail = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No thumbnail uploaded."
            });
        }

        const thumbnail = "/uploads/courses/" + req.file.filename;

        const result = await pool.query(
            `
            UPDATE courses
            SET thumbnail = $1
            WHERE id = $2
            RETURNING *;
            `,
            [thumbnail, req.params.courseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Thumbnail uploaded successfully.",
            course: result.rows[0]
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
// Upload Certificate
// =======================================
const uploadCertificate = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No certificate uploaded."
            });
        }

        const certificateUrl =
            "/uploads/certificates/" + req.file.filename;

        const result = await pool.query(
            `
            UPDATE certificates
            SET certificate_url = $1
            WHERE id = $2
            RETURNING *;
            `,
            [certificateUrl, req.params.certificateId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Certificate uploaded successfully.",
            certificate: result.rows[0]
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
// Exports
// =======================================
module.exports = {
    uploadProfileImage,
    uploadCourseThumbnail,
    uploadCertificate
};