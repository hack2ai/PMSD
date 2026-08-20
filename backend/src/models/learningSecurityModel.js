const pool = require("../config/db");

const getOrCreateWatermarkId = async (userId) => {
    const result = await pool.query(
        `
        UPDATE users
        SET learning_watermark_id = COALESCE(learning_watermark_id, gen_random_uuid())
        WHERE id = $1
        RETURNING id, full_name, email, learning_watermark_id
        `,
        [userId]
    );

    return result.rows[0];
};

const countActiveSessions = async (userId) => {
    const result = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM learning_sessions
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND last_seen_at > NOW() - INTERVAL '20 minutes'
        `,
        [userId]
    );
    return result.rows[0]?.count || 0;
};

const createSecureSession = async ({ id, userId, lectureId, ipAddress, userAgent, deviceFingerprint, watermarkCode }) => {
    const result = await pool.query(
        `
        INSERT INTO learning_sessions
            (id, user_id, lecture_id, ip_address, user_agent, device_fingerprint, watermark_code)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, user_id, lecture_id, started_at, last_seen_at, watermark_code
        `,
        [id, userId, lectureId, ipAddress || null, userAgent || null, deviceFingerprint || null, watermarkCode || null]
    );
    return result.rows[0];
};

const getProgress = async (userId, lectureId) => {
    const result = await pool.query(
        `
        SELECT user_id, lecture_id, watched_seconds, completed,
               last_position_seconds, updated_at
        FROM lecture_progress
        WHERE user_id = $1 AND lecture_id = $2
        `,
        [userId, lectureId]
    );
    return result.rows[0] || null;
};

const upsertProgress = async ({ userId, lectureId, watchedSeconds, lastPositionSeconds, completed }) => {
    const result = await pool.query(
        `
        INSERT INTO lecture_progress
            (user_id, lecture_id, watched_seconds, last_position_seconds, completed)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (user_id, lecture_id)
        DO UPDATE SET
            watched_seconds = GREATEST(lecture_progress.watched_seconds, EXCLUDED.watched_seconds),
            last_position_seconds = EXCLUDED.last_position_seconds,
            completed = lecture_progress.completed OR EXCLUDED.completed,
            updated_at = NOW()
        RETURNING user_id, lecture_id, watched_seconds, completed,
                  last_position_seconds, updated_at
        `,
        [userId, lectureId, Math.max(0, Number(watchedSeconds) || 0), Math.max(0, Number(lastPositionSeconds) || 0), Boolean(completed)]
    );
    return result.rows[0];
};

const revokeOldestActiveSession = async (userId) => {
    const result = await pool.query(
        `
        UPDATE learning_sessions
        SET revoked_at = NOW(), ended_at = NOW()
        WHERE id = (
            SELECT id
            FROM learning_sessions
            WHERE user_id = $1
              AND revoked_at IS NULL
              AND last_seen_at > NOW() - INTERVAL '20 minutes'
            ORDER BY last_seen_at ASC
            LIMIT 1
        )
        RETURNING id
        `,
        [userId]
    );
    return result.rows[0]?.id || null;
};

const listActiveSessions = async () => {
    const result = await pool.query(
        `
        SELECT
            s.id,
            s.user_id,
            u.full_name,
            u.email,
            s.lecture_id,
            l.title AS lecture_title,
            s.ip_address,
            s.user_agent,
            s.device_fingerprint,
            s.watermark_code,
            s.started_at,
            s.last_seen_at
        FROM learning_sessions s
        JOIN users u ON u.id = s.user_id
        LEFT JOIN lectures l ON l.id = s.lecture_id
        WHERE s.revoked_at IS NULL
          AND s.last_seen_at > NOW() - INTERVAL '20 minutes'
        ORDER BY s.last_seen_at DESC
        `
    );
    return result.rows;
};

const revokeSession = async (sessionId) => {
    const result = await pool.query(
        `
        UPDATE learning_sessions
        SET revoked_at = NOW(), ended_at = NOW()
        WHERE id = $1 AND revoked_at IS NULL
        RETURNING id
        `,
        [sessionId]
    );
    return result.rows[0] || null;
};

module.exports = {
    getOrCreateWatermarkId,
    countActiveSessions,
    createSecureSession,
    getProgress,
    upsertProgress,
    revokeOldestActiveSession,
    listActiveSessions,
    revokeSession
};
