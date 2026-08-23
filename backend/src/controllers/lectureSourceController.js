const lectureModel = require("../models/lectureModel");
const lectureSourceModel = require("../models/lectureSourceModel");
const pool = require("../config/db");

const ALLOWED_TYPES = new Set([
    "DIRECT",
    "AUTHORIZED_EXTERNAL",
    "INSTRUCTOR_MIRROR",
    "PMSD_HOSTED",
    "LIVE_SESSION"
]);

const ALLOWED_STATUSES = new Set([
    "AVAILABLE",
    "REQUIRES_AUTH",
    "TEMPORARILY_UNAVAILABLE",
    "EXPIRED",
    "MOVED",
    "DISABLED",
    "UNKNOWN"
]);

const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) return false;

        const hostname = url.hostname.toLowerCase();
        const blockedHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
        if (blockedHostnames.has(hostname)) return false;
        if (hostname.endsWith(".local")) return false;

        return true;
    } catch {
        return false;
    }
};

const canManageCourse = async (user, courseId) => {
    if (!user) return false;
    if (user.role === "admin") return true;

    if (user.role !== "instructor") return false;

    const result = await pool.query(
        `SELECT 1 FROM courses WHERE id = $1 AND created_by = $2 LIMIT 1`,
        [courseId, user.id]
    );

    return result.rowCount > 0;
};

const canAccessLectureMetadata = async (user, lecture) => {
    if (!user || !lecture) return false;
    if (["admin", "instructor"].includes(user.role)) return true;
    if (lecture.status !== "PUBLISHED") return false;

    const result = await pool.query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
        [user.id, lecture.course_id]
    );

    return result.rowCount > 0;
};

const createSource = async (req, res) => {
    try {
        const lecture = await lectureModel.getLectureById(req.params.lectureId);
        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }

        if (!(await canManageCourse(req.user, lecture.course_id))) {
            return res.status(403).json({ success: false, message: "You do not manage this course." });
        }

        const {
            sourceType,
            sourceUrl,
            label,
            priority,
            requiresAuth,
            expiresAt
        } = req.body;

        if (!ALLOWED_TYPES.has(sourceType)) {
            return res.status(400).json({ success: false, message: "Invalid lecture source type." });
        }
        if (!sourceUrl || !isValidUrl(sourceUrl)) {
            return res.status(400).json({ success: false, message: "A valid public HTTP(S) source URL is required." });
        }
        if (!label || !label.trim()) {
            return res.status(400).json({ success: false, message: "Source label is required." });
        }

        if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
            return res.status(400).json({ success: false, message: "Invalid source expiration timestamp." });
        }

        const source = await lectureSourceModel.createSource(req.params.lectureId, req.user.id, {
            sourceType,
            sourceUrl: sourceUrl.trim(),
            label: label.trim(),
            priority: Number.isInteger(priority) && priority >= 0 ? priority : 100,
            requiresAuth: Boolean(requiresAuth),
            expiresAt: expiresAt || null
        });

        return res.status(201).json({
            success: true,
            message: "Lecture source added successfully.",
            source
        });
    } catch (error) {
        console.error("createSource error:", error);
        return res.status(500).json({ success: false, message: "Unable to add lecture source." });
    }
};

const getLectureSources = async (req, res) => {
    try {
        const lecture = await lectureModel.getLectureById(req.params.lectureId);
        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }

        const privileged = ["admin", "instructor"].includes(req.user?.role);
        if (!privileged && !(await canAccessLectureMetadata(req.user, lecture))) {
            return res.status(403).json({
                success: false,
                code: "LECTURE_ACCESS_REQUIRED",
                message: "You are not authorized to inspect lecture sources."
            });
        }

        const includeInactive = privileged;
        const sources = await lectureSourceModel.getSourcesByLectureId(req.params.lectureId, includeInactive);

        const responseSources = privileged
            ? sources
            : sources.map(({ source_url, ...source }) => source);

        return res.status(200).json({
            success: true,
            total: responseSources.length,
            sources: responseSources
        });
    } catch (error) {
        console.error("getLectureSources error:", error);
        return res.status(500).json({ success: false, message: "Unable to load lecture sources." });
    }
};

const updateSourceStatus = async (req, res) => {
    try {
        const { status, httpStatus } = req.body;

        if (!ALLOWED_STATUSES.has(status)) {
            return res.status(400).json({ success: false, message: "Invalid source status." });
        }

        const source = await lectureSourceModel.getSourceById(req.params.sourceId);
        if (!source) {
            return res.status(404).json({ success: false, message: "Lecture source not found." });
        }

        const lecture = await lectureModel.getLectureById(source.lecture_id);
        if (!lecture || !(await canManageCourse(req.user, lecture.course_id))) {
            return res.status(403).json({ success: false, message: "You do not manage this course." });
        }

        if (httpStatus !== undefined && httpStatus !== null &&
            (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599)) {
            return res.status(400).json({ success: false, message: "httpStatus must be a valid HTTP status code." });
        }

        const updated = await lectureSourceModel.updateSourceStatus(
            req.params.sourceId,
            status,
            httpStatus ?? null
        );

        return res.status(200).json({ success: true, source: updated });
    } catch (error) {
        console.error("updateSourceStatus error:", error);
        return res.status(500).json({ success: false, message: "Unable to update source status." });
    }
};

const deactivateSource = async (req, res) => {
    try {
        const source = await lectureSourceModel.getSourceById(req.params.sourceId);
        if (!source) {
            return res.status(404).json({ success: false, message: "Lecture source not found." });
        }

        const lecture = await lectureModel.getLectureById(source.lecture_id);
        if (!lecture || !(await canManageCourse(req.user, lecture.course_id))) {
            return res.status(403).json({ success: false, message: "You do not manage this course." });
        }

        const updated = await lectureSourceModel.deactivateSource(req.params.sourceId);
        return res.status(200).json({ success: true, message: "Lecture source disabled.", source: updated });
    } catch (error) {
        console.error("deactivateSource error:", error);
        return res.status(500).json({ success: false, message: "Unable to disable lecture source." });
    }
};

module.exports = {
    createSource,
    getLectureSources,
    updateSourceStatus,
    deactivateSource
};
