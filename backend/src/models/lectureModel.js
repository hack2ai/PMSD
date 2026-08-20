const pool = require("../config/db");

const getCourseIdForLecture = async (lectureId) => {
    const result = await pool.query(
        `
        SELECT c.id AS course_id
        FROM lectures l
        JOIN course_modules m ON m.id = l.module_id
        JOIN courses c ON c.id = m.course_id
        WHERE l.id = $1
        `,
        [lectureId]
    );

    return result.rows[0]?.course_id;
};

const getLecturesForCourse = async (courseId, includeDrafts = false) => {
    const statusClause = includeDrafts ? "" : "AND l.status = 'published'";

    const result = await pool.query(
        `
        SELECT
            l.id,
            l.module_id,
            l.title,
            l.description,
            l.position,
            l.content_type,
            l.source_type,
            l.duration_seconds,
            l.status,
            l.available_from,
            m.title AS module_title,
            m.position AS module_position
        FROM lectures l
        JOIN course_modules m ON m.id = l.module_id
        WHERE m.course_id = $1
        ${statusClause}
        ORDER BY m.position ASC, l.position ASC
        `,
        [courseId]
    );

    return result.rows;
};

const getLectureById = async (lectureId) => {
    const result = await pool.query(
        `
        SELECT
            l.*,
            m.title AS module_title,
            m.course_id
        FROM lectures l
        JOIN course_modules m ON m.id = l.module_id
        WHERE l.id = $1
        `,
        [lectureId]
    );

    return result.rows[0];
};

const createModule = async (courseId, title, description, position) => {
    const result = await pool.query(
        `
        INSERT INTO course_modules (course_id, title, description, position)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [courseId, title, description || null, position]
    );

    return result.rows[0];
};

const getModulesForCourse = async (courseId) => {
    const result = await pool.query(
        `
        SELECT id, course_id, title, description, position, created_at, updated_at
        FROM course_modules
        WHERE course_id = $1
        ORDER BY position ASC
        `,
        [courseId]
    );

    return result.rows;
};

const createLecture = async ({
    moduleId,
    title,
    description,
    position,
    contentType,
    sourceType,
    telegramChatId,
    telegramMessageId,
    storageKey,
    durationSeconds,
    status,
    availableFrom,
    createdBy
}) => {
    const result = await pool.query(
        `
        INSERT INTO lectures (
            module_id,
            title,
            description,
            position,
            content_type,
            source_type,
            telegram_chat_id,
            telegram_message_id,
            storage_key,
            duration_seconds,
            status,
            available_from,
            created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *
        `,
        [
            moduleId,
            title,
            description || null,
            position,
            contentType || "video",
            sourceType || "telegram",
            telegramChatId || null,
            telegramMessageId || null,
            storageKey || null,
            durationSeconds || null,
            status || "draft",
            availableFrom || null,
            createdBy || null
        ]
    );

    return result.rows[0];
};

const createLearningSession = async ({ id, userId, lectureId, ipAddress, userAgent }) => {
    const result = await pool.query(
        `
        INSERT INTO learning_sessions (id, user_id, lecture_id, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, lecture_id, started_at, last_seen_at
        `,
        [id, userId, lectureId, ipAddress || null, userAgent || null]
    );

    return result.rows[0];
};

const touchLearningSession = async (sessionId, userId) => {
    const result = await pool.query(
        `
        UPDATE learning_sessions
        SET last_seen_at = NOW()
        WHERE id = $1
          AND user_id = $2
          AND revoked_at IS NULL
        RETURNING id
        `,
        [sessionId, userId]
    );

    return Boolean(result.rowCount);
};

const writeAuditLog = async ({ userId, action, resourceType, resourceId, ipAddress, userAgent, metadata }) => {
    await pool.query(
        `
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
            userId || null,
            action,
            resourceType || null,
            resourceId || null,
            ipAddress || null,
            userAgent || null,
            metadata || null
        ]
    );
};

module.exports = {
    getCourseIdForLecture,
    getLecturesForCourse,
    getLectureById,
    createModule,
    getModulesForCourse,
    createLecture,
    createLearningSession,
    touchLearningSession,
    writeAuditLog
};
