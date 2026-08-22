const pool = require("../config/db");

const createSource = async (lectureId, userId, data) => {
    const {
        sourceType,
        sourceUrl,
        label,
        priority = 100,
        requiresAuth = false,
        expiresAt = null
    } = data;

    const result = await pool.query(
        `INSERT INTO lecture_sources
            (lecture_id, source_type, source_url, label, priority, requires_auth, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [lectureId, sourceType, sourceUrl, label, priority, requiresAuth, expiresAt, userId]
    );

    return result.rows[0];
};

const getSourcesByLectureId = async (lectureId, includeInactive = false) => {
    const result = await pool.query(
        `SELECT id, lecture_id, source_type, source_url, label, priority,
                is_active, requires_auth, expires_at, status,
                last_checked_at, last_http_status, created_at, updated_at
         FROM lecture_sources
         WHERE lecture_id = $1
           AND ($2 = TRUE OR is_active = TRUE)
         ORDER BY priority ASC, id ASC`,
        [lectureId, includeInactive]
    );
    return result.rows;
};

const getSourceById = async (sourceId) => {
    const result = await pool.query(
        `SELECT * FROM lecture_sources WHERE id = $1`,
        [sourceId]
    );
    return result.rows[0];
};

const updateSourceStatus = async (sourceId, status, httpStatus = null) => {
    const result = await pool.query(
        `UPDATE lecture_sources
         SET status = $1,
             last_http_status = $2,
             last_checked_at = NOW(),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, httpStatus, sourceId]
    );
    return result.rows[0];
};

const deactivateSource = async (sourceId) => {
    const result = await pool.query(
        `UPDATE lecture_sources
         SET is_active = FALSE, status = 'DISABLED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [sourceId]
    );
    return result.rows[0];
};

module.exports = {
    createSource,
    getSourcesByLectureId,
    getSourceById,
    updateSourceStatus,
    deactivateSource
};
