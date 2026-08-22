const moduleModel = require("../models/moduleModel");
const { getCourseById } = require("../models/courseModel");

const createModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, display_order } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Module title is required." });
        }

        const course = await getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        const module = await moduleModel.createModule(
            courseId,
            title.trim(),
            description,
            Number.isInteger(display_order) ? display_order : 0
        );

        return res.status(201).json({ success: true, message: "Module created successfully.", module });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "A module with this title already exists in the course." });
        }
        console.error("createModule error:", error);
        return res.status(500).json({ success: false, message: "Unable to create module." });
    }
};

const getCourseModules = async (req, res) => {
    try {
        const course = await getCourseById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        const modules = await moduleModel.getModulesByCourseId(req.params.courseId);
        return res.status(200).json({ success: true, total: modules.length, modules });
    } catch (error) {
        console.error("getCourseModules error:", error);
        return res.status(500).json({ success: false, message: "Unable to load course modules." });
    }
};

const updateModule = async (req, res) => {
    try {
        const existing = await moduleModel.getModuleById(req.params.moduleId);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Module not found." });
        }

        const { title, description, display_order } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Module title is required." });
        }

        const module = await moduleModel.updateModule(
            req.params.moduleId,
            title.trim(),
            description,
            Number.isInteger(display_order) ? display_order : existing.display_order
        );

        return res.status(200).json({ success: true, message: "Module updated successfully.", module });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "A module with this title already exists in the course." });
        }
        console.error("updateModule error:", error);
        return res.status(500).json({ success: false, message: "Unable to update module." });
    }
};

const deleteModule = async (req, res) => {
    try {
        const module = await moduleModel.deleteModule(req.params.moduleId);
        if (!module) {
            return res.status(404).json({ success: false, message: "Module not found." });
        }
        return res.status(200).json({ success: true, message: "Module deleted successfully." });
    } catch (error) {
        console.error("deleteModule error:", error);
        return res.status(500).json({ success: false, message: "Unable to delete module." });
    }
};

module.exports = {
    createModule,
    getCourseModules,
    updateModule,
    deleteModule
};
