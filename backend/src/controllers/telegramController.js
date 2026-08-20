const crypto = require("crypto");
const fs = require("fs");
const { createTelegramImport, updateTelegramImport } = require("../models/telegramModel");
const { createLecture } = require("../models/lectureModel");
const { downloadTelegramFile } = require("../services/telegramService");

const importTelegramLecture = async (req, res, next) => {
    const importId = crypto.randomUUID();
    let downloadedFile = null;

    try {
        const {
            fileId,
            fileName,
            contentType = "video",
            telegramMessageId,
            telegramChatId,
            sourceId,
            moduleId,
            title,
            description,
            position = 1,
            durationSeconds,
            status = "draft",
            availableFrom
        } = req.body;

        if (!fileId || !moduleId || !title) {
            return res.status(400).json({
                success: false,
                message: "fileId, moduleId and title are required."
            });
        }

        await createTelegramImport({
            id: importId,
            telegramFileId: fileId,
            telegramMessageId,
            fileName,
            contentType,
            sourceId,
            createdBy: req.user.id
        });

        await updateTelegramImport(importId, { status: "downloading", errorMessage: null });
        downloadedFile = await downloadTelegramFile({ fileId, fileName });

        const lecture = await createLecture({
            moduleId,
            title,
            description,
            position,
            contentType,
            sourceType: "telegram",
            telegramChatId,
            telegramMessageId,
            storageKey: downloadedFile.storageKey,
            durationSeconds,
            status,
            availableFrom,
            createdBy: req.user.id
        });

        await updateTelegramImport(importId, {
            status: "completed",
            storageKey: downloadedFile.storageKey,
            lectureId: lecture.id,
            errorMessage: null,
            completedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Telegram lecture imported into private storage.",
            importId,
            lecture
        });
    } catch (err) {
        await updateTelegramImport(importId, {
            status: "failed",
            errorMessage: err.message
        }).catch(() => undefined);

        if (downloadedFile?.filePath) {
            await fs.promises.unlink(downloadedFile.filePath).catch(() => undefined);
        }

        next(err);
    }
};

module.exports = { importTelegramLecture };
