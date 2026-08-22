const pool = require("../config/db");

const createAccessAttempt = async (data) => {
    const {
        lectureId,
        userId,
        sourceId = null,
        status,
        reason = null,
        httpStatus = null,
        responseTimeMs = null,
        ipHash = null,
        userAgent = null
    } = data;

    const result = await pool.query(
        `INSERT INTO access_attempts
            (lecture_id, user_id, source_id, status, reason, http_status,
             response_time_ms, ip_hash, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, lecture_id, user_id, source_id, status, reason,
                   http_status, response_time_ms, attempted_at`,
        [lectureId, userId, sourceId, status, reason, httpStatus, responseTimeMs, ipHash, userAgent]
    );

    return result.rows[0];
};

module.exports = { createAccessAttempt };
