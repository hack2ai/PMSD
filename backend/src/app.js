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
const lectureRoutes = require("./routes/lectureRoutes");
const telegramRoutes = require("./routes/telegramRoutes");

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only explicitly public asset directories are exposed.
// Private lecture media must live under PRIVATE_MEDIA_ROOT and is never static.
app.use("/uploads/courses", express.static(path.join(process.cwd(), "uploads", "courses")));
app.use("/uploads/profiles", express.static(path.join(process.cwd(), "uploads", "profiles")));
app.use("/certificates", express.static(path.join(process.cwd(), "certificates")));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PMSD Backend Running Successfully"
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
app.use("/api/lectures", lectureRoutes);
app.use("/api/telegram", telegramRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
    console.error("PMSD API error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.status ? err.message : "Internal Server Error"
    });
});

module.exports = app;
