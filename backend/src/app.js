const express = require("express");
const path = require("path");

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
const sourceHealthRoutes = require("./routes/sourceHealthRoutes");
const accessRoutes = require("./routes/accessRoutes");
const lectureProgressRoutes = require("./routes/lectureProgressRoutes");
const auditRoutes = require("./routes/auditRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/certificates", express.static(path.join(__dirname, "../certificates")));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PMSD Backend Running Successfully"
    });
});

app.get("/api/lecture-access/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "lecture-access",
        status: "operational",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/lecture-sources", lectureSourceRoutes);
app.use("/api/source-health", sourceHealthRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/progress", lectureProgressRoutes);
app.use("/api/audit", auditRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;
