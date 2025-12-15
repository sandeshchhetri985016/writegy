CREATE TYPE event_type AS ENUM (
    'USER_LOGIN',
    'USER_LOGOUT',
    'DOCUMENT_CREATED',
    'DOCUMENT_UPDATED',
    'DOCUMENT_DELETED',
    'DOCUMENT_VIEWED',
    'GRAMMAR_CHECK',
    'FILE_UPLOADED'
);

CREATE TABLE user_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type event_type NOT NULL,
    entity_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_created_at ON user_events(created_at DESC);
