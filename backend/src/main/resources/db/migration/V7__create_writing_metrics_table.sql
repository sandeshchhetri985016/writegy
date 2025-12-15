CREATE TABLE writing_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    word_count INTEGER DEFAULT 0,
    documents_created INTEGER DEFAULT 0,
    grammar_score DOUBLE PRECISION DEFAULT 100.0,
    common_errors TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_writing_metrics_user_id ON writing_metrics(user_id);
CREATE INDEX idx_writing_metrics_date ON writing_metrics(date DESC);
