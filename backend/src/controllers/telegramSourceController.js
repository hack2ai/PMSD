const { createTelegramSource, listTelegramSources } = require("../models/telegramModel");
const { setWebhook } = require("../services/telegramService");

const createSource = async (req, res, next) => {
    try {
        const { label, chatId, chatUsername, defaultModuleId, autoPublish = false } = req.body;
        if (!label || !chatId) {
            return res.status(400).json({ success: false, message: "label and chatId are required." });
        }

        const source = await createTelegramSource({
            label, chatId, chatUsername, defaultModuleId, autoPublish, createdBy: req.user.id
        });
        res.status(201).json({ success: true, source });
    } catch (err) {
        next(err);
    }
};

const getSources = async (req, res, next) => {
    try {
        res.json({ success: true, sources: await listTelegramSources() });
    } catch (err) {
        next(err);
    }
};

const registerWebhook = async (req, res, next) => {
    try {
        const { webhookUrl } = req.body;
        const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (!webhookUrl) return res.status(400).json({ success: false, message: "webhookUrl is required." });
        if (!secretToken) return res.status(503).json({ success: false, message: "TELEGRAM_WEBHOOK_SECRET is not configured." });

        const result = await setWebhook({ url: webhookUrl, secretToken });
        res.json({ success: true, telegram: result });
    } catch (err) {
        next(err);
    }
};

module.exports = { createSource, getSources, registerWebhook };
