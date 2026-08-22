const { listAuditLogs } = require("../models/auditLogQueryModel");

const listAuditLogsController = async (req, res) => {
    try {
        const {
            action,
            outcome,
            actorUserId,
            lectureId,
            sourceId,
            from,
            to,
            limit = 50,
            offset = 0
        } = req.query;

        const result = await listAuditLogs({
            action: action || null,
            outcome: outcome || null,
            actorUserId: actorUserId || null,
            lectureId: lectureId || null,
            sourceId: sourceId || null,
            from: from || null,
            to: to || null,
            limit,
            offset
        });

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("listAuditLogsController error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load audit logs."
        });
    }
};

module.exports = { listAuditLogsController };
