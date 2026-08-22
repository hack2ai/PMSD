CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id BIGINT,
    lecture_id BIGINT REFERENCES lectures(id) ON DELETE SET NULL,
    source_id BIGINT REFERENCES lecture_sources(id) ON DELETE SET NULL,
    outcome VARCHAR(40),
    reason VARCHAR(160),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_hash VARCHAR(128),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_time
    ON audit_log(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action_time
    ON audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_lecture_time
    ON audit_log(lecture_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_source_time
    ON audit_log(source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
    ON audit_log(entity_type, entity_id);
