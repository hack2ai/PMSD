const express = require("express");
const path = require("path");

// ===============================
// Route Imports
// ===============================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const lectureSourceRoutes = require("./routes/lectureSourceRoutes");
const accessRoutes = require("./routes/accessRoutes");

const app = express();

// ===============================
// Middlewares
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Static Upload Folder
// ===============================
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// ===============================
// Static Certificate Folder
// ===============================
app.use(
    "/certificates",
    express.static(path.join(__dirname, "../certificates"))
);

// ===============================
// Root Route
// ===============================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PMSD Backend Running Successfully"
    });
});

// ===============================
// Lecture Access Health
// ===============================
app.get("/api/lecture-access/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "lecture-access",
        status: "operational",
        timestamp: new Date().toISOString()
    });
});

// ===============================
// API Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/lecture-sources", lectureSourceRoutes);
app.use("/api/access", accessRoutes);

// ===============================
// 404 Route
// ===============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// ===============================
// Export App
// ===============================
module.exports = app;
