const pool = require("../config/db");

const createTelegramImport = async ({ id, telegramFileId, telegramMessageId, fileName, contentType, createdBy, sourceId }) => {
    const result = await pool.query(
        `
        INSERT INTO telegram_imports (
            id, source_id, telegram_file_id, telegram_message_id, file_name,
            content_type, created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [id, sourceId || null, telegramFileId, telegramMessageId || null, fileName || null, contentType || null, createdBy || null]
    );
    return result.rows[0];
};

const updateTelegramImport = async (id, fields) => {
    const result = await pool.query(
        `
        UPDATE telegram_imports
        SET status = COALESCE($2, status),
            storage_key = COALESCE($3, storage_key),
            lecture_id = COALESCE($4, lecture_id),
            error_message = $5,
            completed_at = COALESCE($6, completed_at)
        WHERE id = $1
        RETURNING *
        `,
        [id, fields.status || null, fields.storageKey || null, fields.lectureId || null, fields.errorMessage || null, fields.completedAt || null]
    );
    return result.rows[0];
};

const findTelegramSourceByChatId = async (chatId) => {
    const result = await pool.query(
        `
        SELECT id, label, chat_id, chat_username, default_module_id, auto_publish
        FROM telegram_sources
        WHERE chat_id = $1 AND active = TRUE
        LIMIT 1
        `,
        [String(chatId)]
    );
    return result.rows[0] || null;
};

const findImportByMessage = async (telegramChatId, telegramMessageId) => {
    const result = await pool.query(
        `
        SELECT id, lecture_id, status
        FROM telegram_imports
        WHERE source_id IN (SELECT id FROM telegram_sources WHERE chat_id = $1)
          AND telegram_message_id = $2
        LIMIT 1
        `,
        [String(telegramChatId), String(telegramMessageId)]
    );
    return result.rows[0] || null;
};

module.exports = {
    createTelegramImport,
    updateTelegramImport,
    findTelegramSourceByChatId,
    findImportByMessage
};
