-- PMSD 2.0: lecture access foundation
-- This migration adds course modules, lectures, approved lecture sources,
-- and auditable access attempts without changing existing LMS tables.

CREATE TABLE IF NOT EXISTS modules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT modules_course_title_unique UNIQUE (course_id, title),
    CONSTRAINT modules_display_order_check CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id
    ON modules(course_id);

CREATE INDEX IF NOT EXISTS idx_modules_course_order
    ON modules(course_id, display_order);

CREATE TABLE IF NOT EXISTS lectures (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    lecture_type VARCHAR(40) NOT NULL DEFAULT 'EXTERNAL',
    duration_seconds INTEGER,
    display_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lectures_type_check CHECK (
        lecture_type IN ('VIDEO', 'PDF', 'LIVE', 'EXTERNAL', 'UPLOADED')
    ),
    CONSTRAINT lectures_status_check CHECK (
        status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'UNAVAILABLE')
    ),
    CONSTRAINT lectures_duration_check CHECK (
        duration_seconds IS NULL OR duration_seconds >= 0
    ),
    CONSTRAINT lectures_display_order_check CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_lectures_module_id
    ON lectures(module_id);

CREATE INDEX IF NOT EXISTS idx_lectures_module_order
    ON lectures(module_id, display_order);

CREATE TABLE IF NOT EXISTS lecture_sources (
    id BIGSERIAL PRIMARY KEY,
    lecture_id BIGINT NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    source_type VARCHAR(40) NOT NULL,
    source_url TEXT NOT NULL,
    label VARCHAR(200) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_auth BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    status VARCHAR(40) NOT NULL DEFAULT 'UNKNOWN',
    last_checked_at TIMESTAMPTZ,
    last_http_status INTEGER,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lecture_sources_type_check CHECK (
        source_type IN ('DIRECT', 'AUTHORIZED_EXTERNAL', 'INSTRUCTOR_MIRROR', 'PMSD_HOSTED', 'LIVE_SESSION')
    ),
    CONSTRAINT lecture_sources_status_check CHECK (
        status IN ('AVAILABLE', 'REQUIRES_AUTH', 'TEMPORARILY_UNAVAILABLE', 'EXPIRED', 'MOVED', 'DISABLED', 'UNKNOWN')
    ),
    CONSTRAINT lecture_sources_priority_check CHECK (priority >= 0),
    CONSTRAINT lecture_sources_http_status_check CHECK (
        last_http_status IS NULL OR (last_http_status BETWEEN 100 AND 599)
    )
);

CREATE INDEX IF NOT EXISTS idx_lecture_sources_lecture_id
    ON lecture_sources(lecture_id);

CREATE INDEX IF NOT EXISTS idx_lecture_sources_active_priority
    ON lecture_sources(lecture_id, is_active, priority);

CREATE INDEX IF NOT EXISTS idx_lecture_sources_status
    ON lecture_sources(status);

CREATE TABLE IF NOT EXISTS access_attempts (
    id BIGSERIAL PRIMARY KEY,
    lecture_id BIGINT NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES lecture_sources(id) ON DELETE SET NULL,
    status VARCHAR(40) NOT NULL,
    reason VARCHAR(120),
    http_status INTEGER,
    response_time_ms INTEGER,
    ip_hash VARCHAR(128),
    user_agent TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT access_attempts_status_check CHECK (
        status IN ('ALLOWED', 'DENIED', 'REQUIRES_AUTH', 'UNAVAILABLE', 'EXPIRED', 'MOVED', 'ERROR')
    ),
    CONSTRAINT access_attempts_http_status_check CHECK (
        http_status IS NULL OR (http_status BETWEEN 100 AND 599)
    ),
    CONSTRAINT access_attempts_response_time_check CHECK (
        response_time_ms IS NULL OR response_time_ms >= 0
    )
);

CREATE INDEX IF NOT EXISTS idx_access_attempts_user_time
    ON access_attempts(user_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_attempts_lecture_time
    ON access_attempts(lecture_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_attempts_status
    ON access_attempts(status);

-- Keep lecture access auditable and consistent with existing enrollment data.
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course
    ON enrollments(user_id, course_id);
