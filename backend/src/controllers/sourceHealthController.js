const sourceHealthService = require("../services/sourceHealthService");

const checkSourceHealth = async (req, res) => {
    try {
        const result = await sourceHealthService.checkAndPersistSource(req.params.sourceId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Lecture source not found."
            });
        }

        return res.status(200).json({
            success: true,
            source: {
                id: result.source.id,
                label: result.source.label,
                status: result.source.status,
                lastHttpStatus: result.source.last_http_status,
                lastCheckedAt: result.source.last_checked_at
            },
            health: result.health
        });
    } catch (error) {
        console.error("checkSourceHealth error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to check source health."
        });
    }
};

module.exports = { checkSourceHealth };
