-- Provider-neutral payment webhook ledger.
-- Stores provider events exactly once so retries cannot double-apply payment state.

CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(80) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    transaction_id VARCHAR(255),
    signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_status VARCHAR(40) NOT NULL DEFAULT 'RECEIVED',
    processing_error TEXT,
    CONSTRAINT payment_webhook_provider_event_unique UNIQUE (provider, event_id),
    CONSTRAINT payment_webhook_status_check CHECK (
        processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')
    )
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_transaction
    ON payment_webhook_events(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_received
    ON payment_webhook_events(received_at DESC);
