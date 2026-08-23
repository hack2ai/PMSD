const pool = require("../config/db");

const createLecture = async (moduleId, data) => {
    const {
        title,
        description = null,
        lectureType = "EXTERNAL",
        durationSeconds = null,
        displayOrder = 0,
        status = "DRAFT"
    } = data;

    const result = await pool.query(
        `INSERT INTO lectures
            (module_id, title, description, lecture_type, duration_seconds, display_order, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [moduleId, title, description, lectureType, durationSeconds, displayOrder, status]
    );

    return result.rows[0];
};

const getLecturesByModuleId = async (moduleId) => {
    const result = await pool.query(
        `SELECT l.*, c.price AS course_price
         FROM lectures l
         JOIN modules m ON m.id = l.module_id
         JOIN courses c ON c.id = m.course_id
         WHERE l.module_id = $1
         ORDER BY l.display_order ASC, l.id ASC`,
        [moduleId]
    );
    return result.rows;
};

const getLectureById = async (lectureId) => {
    const result = await pool.query(
        `SELECT l.*, m.title AS module_title, m.course_id, c.price AS course_price
         FROM lectures l
         JOIN modules m ON m.id = l.module_id
         JOIN courses c ON c.id = m.course_id
         WHERE l.id = $1`,
        [lectureId]
    );
    return result.rows[0];
};

const updateLecture = async (lectureId, data) => {
    const {
        title,
        description,
        lectureType,
        durationSeconds,
        displayOrder,
        status
    } = data;

    const result = await pool.query(
        `UPDATE lectures
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             lecture_type = COALESCE($3, lecture_type),
             duration_seconds = COALESCE($4, duration_seconds),
             display_order = COALESCE($5, display_order),
             status = COALESCE($6, status),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [title, description, lectureType, durationSeconds, displayOrder, status, lectureId]
    );

    return result.rows[0];
};

const deleteLecture = async (lectureId) => {
    const result = await pool.query(
        `DELETE FROM lectures WHERE id = $1 RETURNING *`,
        [lectureId]
    );
    return result.rows[0];
};

module.exports = {
    createLecture,
    getLecturesByModuleId,
    getLectureById,
    updateLecture,
    deleteLecture
};
