CREATE TABLE IF NOT EXISTS telegram_sources (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    chat_id VARCHAR(128) NOT NULL,
    chat_username VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_sources_chat_id ON telegram_sources(chat_id);

CREATE TABLE IF NOT EXISTS telegram_imports (
    id UUID PRIMARY KEY,
    source_id INTEGER REFERENCES telegram_sources(id) ON DELETE SET NULL,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE SET NULL,
    telegram_file_id TEXT NOT NULL,
    telegram_message_id VARCHAR(128),
    file_name VARCHAR(512),
    content_type VARCHAR(128),
    storage_key TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    error_message TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT telegram_imports_status_check CHECK (status IN ('queued', 'downloading', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_telegram_imports_status ON telegram_imports(status);
CREATE INDEX IF NOT EXISTS idx_telegram_imports_lecture_id ON telegram_imports(lecture_id);
