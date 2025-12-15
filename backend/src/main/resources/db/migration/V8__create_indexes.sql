-- Full-text search index for documents
CREATE INDEX idx_documents_content_search ON documents
    USING gin(to_tsvector('english', content));

-- Composite index for user document queries
CREATE INDEX idx_documents_user_status_updated ON documents(user_id, status, updated_at DESC);

-- Index for analytics queries
CREATE INDEX idx_writing_metrics_user_date_range ON writing_metrics(user_id, date);

-- Index for event analytics
CREATE INDEX idx_user_events_user_type_date ON user_events(user_id, event_type, created_at DESC);
