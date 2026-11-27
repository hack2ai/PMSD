const express = require("express");

const app = express();
const apiRouter = express.Router();
let applicationRoutesRegistered = false;
let applicationRouteError = null;

// Keep the Vercel function entrypoint intentionally tiny. Health/root requests
// must not import application middleware, database code, or feature routes.
app.get("/health/live", (req, res) => {
    res.status(200).json({
        success: true,
        status: "alive",
        requestId: req.headers["x-request-id"] || null
    });
});

app.get("/health/ready", async (req, res) => {
    const hasDatabaseUrl = Boolean(
        process.env.DATABASE_URL ||
        process.env.NEON_DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL_UNPOOLED
    );
    const hasDiscreteDbConfig = Boolean(
        process.env.DB_HOST &&
        process.env.DB_USER &&
        process.env.DB_PASSWORD &&
        process.env.DB_NAME
    );

    try {
        const pool = require("./config/db");
        await pool.query("SELECT 1");

        return res.status(200).json({
            success: true,
            status: "ready",
            checks: {
                database: "ok"
            },
            requestId: req.headers["x-request-id"] || null
        });
    } catch (error) {
        const errorCode = error?.code || error?.name || "UNKNOWN_DATABASE_ERROR";
        console.error(JSON.stringify({
            level: "error",
            event: "readiness_check_failed",
            dependency: "database",
            errorCode,
            message: error.message
        }));

        return res.status(503).json({
            success: false,
            status: "not_ready",
            checks: {
                database: "unavailable"
            },
            diagnostics: {
                databaseUrlConfigured: hasDatabaseUrl,
                discreteDbConfigConfigured: hasDiscreteDbConfig,
                errorCode
            },
            requestId: req.headers["x-request-id"] || null
        });
    }
});

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PMSD Backend Running Successfully"
    });
});

const registerApplicationRoutes = () => {
    if (applicationRoutesRegistered || applicationRouteError) {
        return applicationRouteError;
    }

    try {
        const expressJson = express.json({ limit: "1mb" });
        const cors = require("cors");
        const helmet = require("helmet");
        const requestContext = require("./middleware/requestContext");
        const requestLogger = require("./middleware/requestLogger");
        const path = require("path");

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

        apiRouter.use(requestContext);
        apiRouter.use(requestLogger);
        apiRouter.use(helmet());
        apiRouter.use(cors({
            origin(origin, callback) {
                const configured = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
                if (!origin || configured.length === 0 || configured.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error("CORS origin not allowed."));
            },
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-PMSD-Signature", "X-Webhook-Signature", "X-Request-Id"]
        }));

        apiRouter.use("/payments/webhooks", paymentWebhookRoutes);
        apiRouter.use(expressJson);
        apiRouter.use(express.urlencoded({ extended: true, limit: "1mb" }));

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
                requestId: req.requestId || null
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
            message: "Application routes failed to initialize."
        });
    }
    return apiRouter(req, res, next);
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

module.exports = app;
