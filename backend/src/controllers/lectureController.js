const lectureModel = require("../models/lectureModel");
const moduleModel = require("../models/moduleModel");

const createLecture = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, description, lecture_type, duration_seconds, display_order, status } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Lecture title is required." });
        }

        const module = await moduleModel.getModuleById(moduleId);
        if (!module) {
            return res.status(404).json({ success: false, message: "Module not found." });
        }

        const lecture = await lectureModel.createLecture(
            moduleId,
            title.trim(),
            description,
            lecture_type || "EXTERNAL",
            Number.isInteger(duration_seconds) ? duration_seconds : null,
            Number.isInteger(display_order) ? display_order : 0,
            status || "DRAFT"
        );

        return res.status(201).json({ success: true, message: "Lecture created successfully.", lecture });
    } catch (error) {
        console.error("createLecture error:", error);
        return res.status(500).json({ success: false, message: "Unable to create lecture." });
    }
};

const getModuleLectures = async (req, res) => {
    try {
        const module = await moduleModel.getModuleById(req.params.moduleId);
        if (!module) {
            return res.status(404).json({ success: false, message: "Module not found." });
        }

        const lectures = await lectureModel.getLecturesByModuleId(req.params.moduleId);
        return res.status(200).json({ success: true, total: lectures.length, lectures });
    } catch (error) {
        console.error("getModuleLectures error:", error);
        return res.status(500).json({ success: false, message: "Unable to load lectures." });
    }
};

const getLecture = async (req, res) => {
    try {
        const lecture = await lectureModel.getLectureById(req.params.lectureId);
        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }
        return res.status(200).json({ success: true, lecture });
    } catch (error) {
        console.error("getLecture error:", error);
        return res.status(500).json({ success: false, message: "Unable to load lecture." });
    }
};

const updateLecture = async (req, res) => {
    try {
        const existing = await lectureModel.getLectureById(req.params.lectureId);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }

        const { title, description, lecture_type, duration_seconds, display_order, status } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Lecture title is required." });
        }

        const lecture = await lectureModel.updateLecture(
            req.params.lectureId,
            title.trim(),
            description,
            lecture_type || existing.lecture_type,
            Number.isInteger(duration_seconds) ? duration_seconds : existing.duration_seconds,
            Number.isInteger(display_order) ? display_order : existing.display_order,
            status || existing.status
        );

        return res.status(200).json({ success: true, message: "Lecture updated successfully.", lecture });
    } catch (error) {
        console.error("updateLecture error:", error);
        return res.status(500).json({ success: false, message: "Unable to update lecture." });
    }
};

const deleteLecture = async (req, res) => {
    try {
        const lecture = await lectureModel.deleteLecture(req.params.lectureId);
        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found." });
        }
        return res.status(200).json({ success: true, message: "Lecture deleted successfully." });
    } catch (error) {
        console.error("deleteLecture error:", error);
        return res.status(500).json({ success: false, message: "Unable to delete lecture." });
    }
};

module.exports = {
    createLecture,
    getModuleLectures,
    getLecture,
    updateLecture,
    deleteLecture
};
