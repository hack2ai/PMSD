const {
    createCertificate,
    getCertificateByNumber,
    getMyCertificates,
    getAllCertificates,
    deleteCertificate
} = require("../models/certificateModel");

const { getCourseById } = require("../models/courseModel");
const { findUserById } = require("../models/userModel");
const generateCertificatePDF = require("../utils/pdfGenerator");

// =======================================
// Generate Certificate
// =======================================
const generateCertificate = async (req, res) => {

    try {

        const userId = req.user.id;
        const courseId = req.body.courseId || req.body.course_id;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required."
            });
        }

        console.log("📘 Course ID Received:", courseId);

        // =======================================
        // Check Course
        // =======================================
        const course = await getCourseById(courseId);

        console.log("📘 Course Found:", course);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found."
            });
        }

        // =======================================
        // Check User
        // =======================================
        const user = await findUserById(userId);

        console.log("👤 User Found:", user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // =======================================
        // Certificate Details
        // =======================================
        const certificateNumber =
            `PMSD-${new Date().getFullYear()}-${Date.now()}`;

        const issueDate =
            new Date().toLocaleDateString("en-IN");

        // =======================================
        // Generate PDF
        // =======================================
        let pdf;

        try {

            pdf = await generateCertificatePDF(
                user.full_name,
                course.title,
                course.instructor,
                certificateNumber,
                issueDate
            );

            console.log("✅ PDF Generated:", pdf);

        } catch (err) {

            console.error("❌ PDF GENERATOR ERROR");
            console.error(err);
            console.error(err.stack);

            throw err;

        }

        // =======================================
        // Save Certificate
        // =======================================
        const certificate = await createCertificate(
            userId,
            courseId,
            certificateNumber,
            `/certificates/${pdf.fileName}`
        );

        return res.status(201).json({
            success: true,
            message: "Certificate generated successfully.",
            certificate
        });

    } catch (err) {

        console.error("❌ Certificate Error:");
        console.error(err);
        console.error(err.stack);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// My Certificates
// =======================================
const myCertificates = async (req, res) => {

    try {

        const certificates =
            await getMyCertificates(req.user.id);

        return res.status(200).json({
            success: true,
            total: certificates.length,
            certificates
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
// Get All Certificates
// =======================================
const allCertificates = async (req, res) => {

    try {

        const certificates =
            await getAllCertificates();

        return res.status(200).json({
            success: true,
            total: certificates.length,
            certificates
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
// Verify Certificate
// =======================================
const verifyCertificate = async (req, res) => {

    try {

        const certificate =
            await getCertificateByNumber(req.params.number);

        if (!certificate) {

            return res.status(404).json({
                success: false,
                message: "Certificate not found."
            });

        }

        return res.status(200).json({
            success: true,
            certificate
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
// Delete Certificate
// =======================================
const removeCertificate = async (req, res) => {

    try {

        const certificate =
            await deleteCertificate(req.params.id);

        if (!certificate) {

            return res.status(404).json({
                success: false,
                message: "Certificate not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Certificate deleted successfully."
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
    generateCertificate,
    myCertificates,
    allCertificates,
    verifyCertificate,
    removeCertificate
};