const pool = require("../config/db");

const listAuditLogs = async ({
    action = null,
    outcome = null,
    actorUserId = null,
    lectureId = null,
    sourceId = null,
    from = null,
    to = null,
    limit = 50,
    offset = 0
} = {}) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const values = [];
    const where = [];
    const add = (value) => {
        values.push(value);
        return `$${values.length}`;
    };

    if (action) where.push(`a.action = ${add(action)}`);
    if (outcome) where.push(`a.outcome = ${add(outcome)}`);
    if (actorUserId) where.push(`a.actor_user_id = ${add(actorUserId)}`);
    if (lectureId) where.push(`a.lecture_id = ${add(lectureId)}`);
    if (sourceId) where.push(`a.source_id = ${add(sourceId)}`);
    if (from) where.push(`a.created_at >= ${add(from)}`);
    if (to) where.push(`a.created_at <= ${add(to)}`);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM audit_log a ${whereSql}`,
        values
    );

    const rowValues = [...values, safeLimit, safeOffset];
    const rows = await pool.query(
        `SELECT
            a.id,
            a.actor_user_id,
            a.action,
            a.entity_type,
            a.entity_id,
            a.lecture_id,
            a.source_id,
            a.outcome,
            a.reason,
            a.metadata,
            a.created_at
         FROM audit_log a
         ${whereSql}
         ORDER BY a.created_at DESC
         LIMIT $${rowValues.length - 1} OFFSET $${rowValues.length}`,
        rowValues
    );

    return {
        total: countResult.rows[0]?.total || 0,
        limit: safeLimit,
        offset: safeOffset,
        logs: rows.rows
    };
};

module.exports = { listAuditLogs };
