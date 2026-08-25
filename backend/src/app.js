const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const requestContext = require("./middleware/requestContext");
const requestLogger = require("./middleware/requestLogger");
const healthRoutes = require("./routes/healthRoutes");

const getRuntimeConfig = () => {
    const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (process.env.VERCEL_URL) {
        configuredOrigins.push(`https://${process.env.VERCEL_URL}`);
    }

    return {
        nodeEnv: process.env.NODE_ENV || "production",
        port: Number(process.env.PORT || 3000),
        frontendUrl: process.env.FRONTEND_URL || configuredOrigins[0] || "http://localhost:5173",
        corsOrigins: [...new Set(configuredOrigins)]
    };
};

// src/app.js is also the direct Vercel function entrypoint. Never perform
// strict production validation here because a health request must be able to
// boot independently. Traditional deployments validate in server.js.
const config = getRuntimeConfig();
const app = express();
const apiRouter = express.Router();
let applicationRoutesRegistered = false;
let applicationRouteError = null;

app.disable("x-powered-by");
app.use(requestContext);
app.use(requestLogger);
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-PMSD-Signature", "X-Webhook-Signature", "X-Request-Id"],
    credentials: false
}));

// Public operational endpoint. It deliberately loads before application
// routes and does not depend on the database or feature modules.
app.use("/health", healthRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/certificates", express.static(path.join(__dirname, "../certificates")));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PMSD Backend Running Successfully",
        requestId: req.requestId
    });
});

const registerApplicationRoutes = () => {
    if (applicationRoutesRegistered || applicationRouteError) {
        return applicationRouteError;
    }

    try {
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

        apiRouter.use("/payments/webhooks", paymentWebhookRoutes);
        apiRouter.use("/auth", authRoutes);
        apiRouter.use("/users", userRoutes);
        apiRouter.use("/courses", courseRoutes);
        apiRouter.use("/enrollments", enrollmentRoutes);
        apiRouter.use("/payments", paymentRoutes);
        apiRouter.use("/certificates", certificateRoutes);
        apiRouter.use("/uploads", uploadRoutes);
        apiRouter.use("/dashboard", dashboardRoutes);
        apiRouter.use("/admin", adminDashboardRoutes);
        apiRouter.use("/modules", moduleRoutes);
        apiRouter.use("/lectures", lectureRoutes);
        apiRouter.use("/lecture-sources", lectureSourceRoutes);
        apiRouter.use("/source-health", sourceHealthRoutes);
        apiRouter.use("/access", accessRoutes);
        apiRouter.use("/progress", lectureProgressRoutes);
        apiRouter.use("/audit", auditRoutes);

        apiRouter.get("/lecture-access/health", (req, res) => {
            res.status(200).json({
                success: true,
                service: "lecture-access",
                status: "operational",
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        });

        applicationRoutesRegistered = true;
        return null;
    } catch (error) {
        applicationRouteError = error;
        console.error(JSON.stringify({
            level: "error",
            event: "application_routes_registration_failed",
            error: error.message,
            stack: error.stack
        }));
        return error;
    }
};

app.use("/api", (req, res, next) => {
    const error = registerApplicationRoutes();
    if (error) {
        return res.status(500).json({
            success: false,
            message: "Application routes failed to initialize.",
            requestId: req.requestId
        });
    }
    return apiRouter(req, res, next);
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

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
