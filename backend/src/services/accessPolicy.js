const isExpired = (expiresAt, now = Date.now()) => {
    if (!expiresAt) return false;
    const timestamp = new Date(expiresAt).getTime();
    return Number.isFinite(timestamp) && timestamp <= now;
};

const getAvailableSources = (sources, now = Date.now()) => {
    return sources.filter((source) => {
        if (!source || source.is_active === false) return false;
        if (source.status === "DISABLED") return false;
        if (isExpired(source.expires_at, now)) return false;
        return true;
    });
};

const selectBestSource = (sources, now = Date.now()) => {
    const candidates = getAvailableSources(sources, now)
        .slice()
        .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id - b.id);

    return candidates.find((source) => source.status === "AVAILABLE")
        || candidates.find((source) => source.status === "REQUIRES_AUTH" || source.requires_auth)
        || candidates[0]
        || null;
};

module.exports = {
    isExpired,
    getAvailableSources,
    selectBestSource
};
