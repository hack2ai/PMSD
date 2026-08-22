const pool = require("../config/db");

const getProgress = async (userId, lectureId) => {
    const result = await pool.query(
        `SELECT * FROM lecture_progress WHERE user_id = $1 AND lecture_id = $2`,
        [userId, lectureId]
    );
    return result.rows[0] || null;
};

const upsertProgress = async (userId, lectureId, progressSeconds, completed = false) => {
    const result = await pool.query(
        `INSERT INTO lecture_progress
            (user_id, lecture_id, progress_seconds, completed, completed_at, last_accessed_at, updated_at)
         VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END, NOW(), NOW())
         ON CONFLICT (user_id, lecture_id)
         DO UPDATE SET
            progress_seconds = GREATEST(lecture_progress.progress_seconds, EXCLUDED.progress_seconds),
            completed = lecture_progress.completed OR EXCLUDED.completed,
            completed_at = CASE
                WHEN lecture_progress.completed_at IS NOT NULL THEN lecture_progress.completed_at
                WHEN EXCLUDED.completed THEN NOW()
                ELSE NULL
            END,
            last_accessed_at = NOW(),
            updated_at = NOW()
         RETURNING *`,
        [userId, lectureId, Math.max(0, Number(progressSeconds) || 0), Boolean(completed)]
    );
    return result.rows[0];
};

const getCourseProgress = async (userId, courseId) => {
    const result = await pool.query(
        `SELECT
            COUNT(l.id)::int AS total_lectures,
            COUNT(lp.id) FILTER (WHERE lp.completed)::int AS completed_lectures,
            COALESCE(SUM(lp.progress_seconds), 0)::int AS watched_seconds
         FROM lectures l
         JOIN modules m ON m.id = l.module_id
         LEFT JOIN lecture_progress lp
           ON lp.lecture_id = l.id AND lp.user_id = $1
         WHERE m.course_id = $2 AND l.status = 'PUBLISHED'`,
        [userId, courseId]
    );
    const row = result.rows[0];
    const total = row.total_lectures || 0;
    const completed = row.completed_lectures || 0;
    return {
        totalLectures: total,
        completedLectures: completed,
        watchedSeconds: row.watched_seconds || 0,
        percentage: total ? Math.round((completed / total) * 100) : 0
    };
};

const getContinueLecture = async (userId, courseId) => {
    const result = await pool.query(
        `SELECT
            l.id,
            l.title,
            l.lecture_type,
            l.status,
            lp.progress_seconds,
            lp.last_accessed_at,
            m.id AS module_id,
            m.title AS module_title,
            m.display_order AS module_order,
            l.display_order AS lecture_order
         FROM lecture_progress lp
         JOIN lectures l ON l.id = lp.lecture_id
         JOIN modules m ON m.id = l.module_id
         WHERE lp.user_id = $1
           AND m.course_id = $2
           AND l.status = 'PUBLISHED'
           AND lp.completed = FALSE
         ORDER BY lp.last_accessed_at DESC NULLS LAST,
                  m.display_order ASC,
                  l.display_order ASC,
                  l.id ASC
         LIMIT 1`,
        [userId, courseId]
    );

    return result.rows[0] || null;
};

module.exports = {
    getProgress,
    upsertProgress,
    getCourseProgress,
    getContinueLecture
};
