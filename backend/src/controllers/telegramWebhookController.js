const crypto = require("crypto");
const fs = require("fs");
const {
    findTelegramSourceByChatId,
    findImportByMessage,
    createTelegramImport,
    updateTelegramImport
} = require("../models/telegramModel");
const { getNextLecturePosition, createLecture, writeAuditLog } = require("../models/lectureModel");
const { downloadTelegramFile } = require("../services/telegramService");

const getSecret = () => process.env.TELEGRAM_WEBHOOK_SECRET || "";

const extractMedia = (message) => {
    if (message.video?.file_id) {
        return {
            fileId: message.video.file_id,
            fileName: message.video.file_name || `telegram-${message.message_id}.mp4`,
            contentType: "video",
            durationSeconds: message.video.duration || null,
            title: message.caption || message.video.file_name || `Lecture ${message.message_id}`
        };
    }

    if (message.document?.file_id) {
        return {
            fileId: message.document.file_id,
            fileName: message.document.file_name || `telegram-${message.message_id}.bin`,
            contentType: message.document.mime_type?.startsWith("video/") ? "video" : "document",
            durationSeconds: null,
            title: message.caption || message.document.file_name || `Lecture ${message.message_id}`
        };
    }

    if (message.audio?.file_id) {
        return {
            fileId: message.audio.file_id,
            fileName: message.audio.file_name || `telegram-${message.message_id}.mp3`,
            contentType: "audio",
            durationSeconds: message.audio.duration || null,
            title: message.caption || message.audio.title || `Audio lecture ${message.message_id}`
        };
    }

    return null;
};

const processChannelPost = async (message) => {
    const source = await findTelegramSourceByChatId(message.chat?.id);
    if (!source || !source.default_module_id) {
        return { ignored: true, reason: "source_not_configured" };
    }

    const existing = await findImportByMessage(message.chat.id, message.message_id);
    if (existing) return { duplicate: true, importId: existing.id, lectureId: existing.lecture_id };

    const media = extractMedia(message);
    if (!media) return { ignored: true, reason: "unsupported_media" };

    const importId = crypto.randomUUID();
    let downloadedFile = null;
    try {
        await createTelegramImport({
            id: importId,
            telegramFileId: media.fileId,
            telegramMessageId: message.message_id,
            fileName: media.fileName,
            contentType: media.contentType,
            sourceId: source.id,
            createdBy: null
        });
        await updateTelegramImport(importId, { status: "downloading", errorMessage: null });

        downloadedFile = await downloadTelegramFile({ fileId: media.fileId, fileName: media.fileName });
        const position = await getNextLecturePosition(source.default_module_id);
        const lecture = await createLecture({
            moduleId: source.default_module_id,
            title: media.title.slice(0, 255),
            description: message.caption || null,
            position,
            contentType: media.contentType,
            sourceType: "telegram",
            telegramChatId: String(message.chat.id),
            telegramMessageId: String(message.message_id),
            storageKey: downloadedFile.storageKey,
            durationSeconds: media.durationSeconds,
            status: source.auto_publish ? "published" : "draft",
            createdBy: null
        });

        await updateTelegramImport(importId, {
            status: "completed",
            storageKey: downloadedFile.storageKey,
            lectureId: lecture.id,
            errorMessage: null,
            completedAt: new Date()
        });

        return { created: true, lectureId: lecture.id, importId, status: lecture.status };
    } catch (err) {
        await updateTelegramImport(importId, { status: "failed", errorMessage: err.message }).catch(() => undefined);
        if (downloadedFile?.filePath) await fs.promises.unlink(downloadedFile.filePath).catch(() => undefined);
        throw err;
    }
};

const receiveTelegramWebhook = async (req, res) => {
    const expectedSecret = getSecret();
    const receivedSecret = req.get("x-telegram-bot-api-secret-token") || "";
    if (!expectedSecret || receivedSecret !== expectedSecret) {
        return res.status(401).json({ success: false, message: "Invalid Telegram webhook secret." });
    }

    const update = req.body || {};
    res.status(200).json({ success: true, accepted: true });

    const message = update.channel_post || update.message;
    if (!message) return;

    try {
        const result = await processChannelPost(message);
        console.log("Telegram webhook processed:", result);
    } catch (err) {
        console.error("Telegram webhook processing failed:", err.message);
        await writeAuditLog({
            action: "telegram.webhook_error",
            resourceType: "telegram_message",
            resourceId: String(message.message_id || "unknown"),
            metadata: { chatId: message.chat?.id, error: err.message }
        }).catch(() => undefined);
    }
};

module.exports = { receiveTelegramWebhook };
