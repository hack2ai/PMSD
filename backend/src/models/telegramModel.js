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
        [id, sourceId || null, telegramFileId, telegramMessageId || null, fileName || null, contentType || null, createdBy]
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

module.exports = { createTelegramImport, updateTelegramImport };
