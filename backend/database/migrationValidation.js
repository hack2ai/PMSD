const MIGRATION_FILENAME_PATTERN = /^\d{3}_[a-z0-9][a-z0-9_-]*\.sql$/;

const isValidMigrationFilename = (filename) =>
    typeof filename === "string" && MIGRATION_FILENAME_PATTERN.test(filename);

const isNonEmptyMigration = (sql) => {
    if (typeof sql !== "string") return false;
    const withoutComments = sql
        .replace(/--.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
    return withoutComments.trim().length > 0;
};

module.exports = {
    MIGRATION_FILENAME_PATTERN,
    isValidMigrationFilename,
    isNonEmptyMigration
};