-- V10: Backfill document word_count and character_count for legacy documents
-- This migration runs once at startup to populate metrics for documents created before
-- the word count calculation feature was added.

-- Backfill word_count using PostgreSQL string functions
UPDATE documents
SET word_count = CASE
    WHEN content IS NULL OR trim(content) = '' THEN 0
    ELSE array_length(
        regexp_split_to_array(trim(content), '\s+'),
        1
    )
END
WHERE word_count IS NULL OR word_count = 0;

-- Backfill character_count (excluding whitespace)
UPDATE documents
SET character_count = CASE
    WHEN content IS NULL OR trim(content) = '' THEN 0
    ELSE length(replace(replace(replace(content, ' ', ''), E'\t', ''), E'\n', ''))
END
WHERE character_count IS NULL OR character_count = 0;

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'V10 migration completed: Document metrics backfilled';
END $$;