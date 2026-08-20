-- Learning progress, student watermark identity, and session controls.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS learning_watermark_id UUID;

UPDATE users
SET learning_watermark_id = gen_random_uuid()
WHERE learning_watermark_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_learning_watermark_id
    ON users(learning_watermark_id)
    WHERE learning_watermark_id IS NOT NULL;

ALTER TABLE learning_sessions
    ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(128),
    ADD COLUMN IF NOT EXISTS watermark_code VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_active_user
    ON learning_sessions(user_id, last_seen_at DESC)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_learning_sessions_device
    ON learning_sessions(user_id, device_fingerprint)
    WHERE revoked_at IS NULL;
