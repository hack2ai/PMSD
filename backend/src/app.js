const express = require("express");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const lectureRoutes = require("./routes/lectureRoutes");

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
