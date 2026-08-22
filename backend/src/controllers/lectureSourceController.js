const lectureModel = require("../models/lectureModel");
const lectureSourceModel = require("../models/lectureSourceModel");

const ALLOWED_TYPES = new Set([
    "DIRECT",
    "AUTHORIZED_EXTERNAL",
    "INSTRUCTOR_MIRROR",
    "PMSD_HOSTED",
    "LIVE_SESSION"
]);

const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

const createSource = async (req, res) => {
    try {
        const lecture = await lectureModel.getLectureById(req.params.lectureId);
        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
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
            return res.status(400).json({ success: false, message: "A valid HTTP(S) source URL is required." });
        }
        if (!label || !label.trim()) {
            return res.status(400).json({ success: false, message: "Source label is required." });
        }

        const source = await lectureSourceModel.createSource(req.params.lectureId, req.user.id, {
            sourceType,
            sourceUrl,
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

        const includeInactive = req.user?.role === "admin" || req.user?.role === "instructor";
        const sources = await lectureSourceModel.getSourcesByLectureId(req.params.lectureId, includeInactive);

        // Never expose source URLs to students from this management endpoint.
        const responseSources = includeInactive
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
        const allowedStatuses = new Set([
            "AVAILABLE",
            "REQUIRES_AUTH",
            "TEMPORARILY_UNAVAILABLE",
            "EXPIRED",
            "MOVED",
            "DISABLED",
            "UNKNOWN"
        ]);

        if (!allowedStatuses.has(status)) {
            return res.status(400).json({ success: false, message: "Invalid source status." });
        }

        const source = await lectureSourceModel.getSourceById(req.params.sourceId);
        if (!source) {
            return res.status(404).json({ success: false, message: "Lecture source not found." });
        }

        const updated = await lectureSourceModel.updateSourceStatus(
            req.params.sourceId,
            status,
            Number.isInteger(httpStatus) ? httpStatus : null
        );

        return res.status(200).json({ success: true, source: updated });
    } catch (error) {
        console.error("updateSourceStatus error:", error);
        return res.status(500).json({ success: false, message: "Unable to update source status." });
    }
};

const deactivateSource = async (req, res) => {
    try {
        const source = await lectureSourceModel.deactivateSource(req.params.sourceId);
        if (!source) {
            return res.status(404).json({ success: false, message: "Lecture source not found." });
        }
        return res.status(200).json({ success: true, message: "Lecture source disabled.", source });
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
