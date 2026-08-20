const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

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
const telegramSourceRoutes = require("./routes/telegramSourceRoutes");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by PMSD CORS policy."));
    },
    credentials: false
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || "1mb" }));

// Private lecture media is never exposed through static middleware.
app.use("/uploads/courses", express.static(path.join(process.cwd(), "uploads", "courses")));
app.use("/uploads/profiles", express.static(path.join(process.cwd(), "uploads", "profiles")));
app.use("/certificates", express.static(path.join(process.cwd(), "certificates")));

app.use((_req, res, next) => {
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
});

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        service: "pmsd-backend"
    });
});

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        service: "pmsd-backend"
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
app.use("/api/telegram", telegramSourceRoutes);

app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, _req, res, _next) => {
    console.error("PMSD API error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.status ? err.message : "Internal Server Error"
    });
});

module.exports = app;
