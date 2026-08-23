const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const requestContext = require("./middleware/requestContext");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentWebhookRoutes = require("./routes/paymentWebhookRoutes");
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
const { validateEnv } = require("./config/env");

const config = validateEnv();
const app = express();

app.disable("x-powered-by");
app.use(requestContext);
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-PMSD-Signature", "X-Webhook-Signature", "X-Request-Id"],
    credentials: false
}));

// Payment-provider callbacks must capture the exact signed bytes before
// the normal JSON parser runs.
app.use("/api/payments/webhooks", paymentWebhookRoutes);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/certificates", express.static(path.join(__dirname, "../certificates")));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PMSD Backend Running Successfully",
        requestId: req.requestId
    });
});

app.get("/api/lecture-access/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "lecture-access",
        status: "operational",
        timestamp: new Date().toISOString(),
        requestId: req.requestId
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
        message: "Route not found.",
        requestId: req.requestId
    });
});

app.use((err, req, res, next) => {
    console.error(JSON.stringify({
        level: "error",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        error: err.message || "Internal Server Error"
    }));

    res.status(err.status || 500).json({
        success: false,
        message: err.status && err.status < 500 ? err.message : "Internal Server Error",
        requestId: req.requestId
    });
});

module.exports = app;
