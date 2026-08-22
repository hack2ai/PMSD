CREATE TABLE IF NOT EXISTS lecture_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecture_id BIGINT NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    progress_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lecture_progress_seconds_check CHECK (progress_seconds >= 0),
    CONSTRAINT lecture_progress_unique UNIQUE (user_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_user
    ON lecture_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture
    ON lecture_progress(lecture_id);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_user_completed
    ON lecture_progress(user_id, completed);
