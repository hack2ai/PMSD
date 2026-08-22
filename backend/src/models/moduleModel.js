const pool = require("../config/db");

const createModule = async (courseId, title, description, displayOrder = 0) => {
    const result = await pool.query(
        `INSERT INTO modules (course_id, title, description, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [courseId, title, description || null, displayOrder]
    );
    return result.rows[0];
};

const getModulesByCourseId = async (courseId) => {
    const result = await pool.query(
        `SELECT m.id, m.course_id, m.title, m.description, m.display_order,
                m.created_at, m.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', l.id,
                            'title', l.title,
                            'description', l.description,
                            'lecture_type', l.lecture_type,
                            'duration_seconds', l.duration_seconds,
                            'display_order', l.display_order,
                            'status', l.status
                        ) ORDER BY l.display_order ASC, l.id ASC
                    ) FILTER (WHERE l.id IS NOT NULL),
                    '[]'::json
                ) AS lectures
         FROM modules m
         LEFT JOIN lectures l ON l.module_id = m.id AND l.status <> 'ARCHIVED'
         WHERE m.course_id = $1
         GROUP BY m.id
         ORDER BY m.display_order ASC, m.id ASC`,
        [courseId]
    );
    return result.rows;
};

const getModuleById = async (moduleId) => {
    const result = await pool.query(
        `SELECT m.*, c.title AS course_title
         FROM modules m
         JOIN courses c ON c.id = m.course_id
         WHERE m.id = $1`,
        [moduleId]
    );
    return result.rows[0];
};

const updateModule = async (moduleId, title, description, displayOrder) => {
    const result = await pool.query(
        `UPDATE modules
         SET title = $1, description = $2, display_order = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [title, description || null, displayOrder, moduleId]
    );
    return result.rows[0];
};

const deleteModule = async (moduleId) => {
    const result = await pool.query(
        `DELETE FROM modules WHERE id = $1 RETURNING *`,
        [moduleId]
    );
    return result.rows[0];
};

module.exports = {
    createModule,
    getModulesByCourseId,
    getModuleById,
    updateModule,
    deleteModule
};
