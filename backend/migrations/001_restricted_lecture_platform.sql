-- PMSD restricted lecture platform foundation
-- Run this migration after the existing users/courses/enrollments tables exist.

CREATE TABLE IF NOT EXISTS course_modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, position)
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id
    ON course_modules(course_id);

CREATE TABLE IF NOT EXISTS lectures (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 1,
    content_type VARCHAR(32) NOT NULL DEFAULT 'video',
    source_type VARCHAR(32) NOT NULL DEFAULT 'telegram',
    telegram_chat_id VARCHAR(128),
    telegram_message_id VARCHAR(128),
    storage_key TEXT,
    duration_seconds INTEGER,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    available_from TIMESTAMPTZ,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (module_id, position),
    CONSTRAINT lectures_content_type_check CHECK (content_type IN ('video', 'pdf', 'audio', 'document', 'link')),
    CONSTRAINT lectures_source_type_check CHECK (source_type IN ('telegram', 'upload', 'external')),
    CONSTRAINT lectures_status_check CHECK (status IN ('draft', 'processing', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_lectures_module_id
    ON lectures(module_id);

CREATE INDEX IF NOT EXISTS idx_lectures_status
    ON lectures(status);

CREATE INDEX IF NOT EXISTS idx_lectures_telegram_message
    ON lectures(telegram_chat_id, telegram_message_id);

CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id
    ON learning_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_lecture_id
    ON learning_sessions(lecture_id);

CREATE TABLE IF NOT EXISTS lecture_progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_position_seconds INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, lecture_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(128),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at
    ON audit_logs(action, created_at DESC);
