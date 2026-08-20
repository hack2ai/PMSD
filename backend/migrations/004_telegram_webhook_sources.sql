-- Map Telegram channels to a default module and publishing policy for automatic ingestion.
ALTER TABLE telegram_sources
    ADD COLUMN IF NOT EXISTS default_module_id INTEGER REFERENCES course_modules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_telegram_sources_default_module
    ON telegram_sources(default_module_id);
