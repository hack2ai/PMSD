const pool = require("../config/db");

const createAuditLog = async ({
    actorUserId = null,
    action,
    entityType,
    entityId = null,
    lectureId = null,
    sourceId = null,
    outcome = null,
    reason = null,
    metadata = {},
    ipHash = null,
    userAgent = null
}) => {
    const result = await pool.query(
        `INSERT INTO audit_log
            (actor_user_id, action, entity_type, entity_id, lecture_id, source_id,
             outcome, reason, metadata, ip_hash, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
         RETURNING id, actor_user_id, action, entity_type, entity_id, lecture_id,
                   source_id, outcome, reason, metadata, created_at`,
        [
            actorUserId,
            action,
            entityType,
            entityId,
            lectureId,
            sourceId,
            outcome,
            reason,
            JSON.stringify(metadata || {}),
            ipHash,
            userAgent
        ]
    );

    return result.rows[0];
};

module.exports = { createAuditLog };
