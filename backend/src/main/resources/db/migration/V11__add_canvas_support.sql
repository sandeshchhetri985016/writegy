-- Add canvas support to documents table
-- This allows documents to store both text content and canvas (handwriting/drawing) data

-- Add canvas_data column for storing tldraw JSON state
ALTER TABLE documents ADD COLUMN canvas_data JSONB;

-- Add content_type to distinguish between text and canvas documents
ALTER TABLE documents ADD COLUMN content_type VARCHAR(20) DEFAULT 'text';

-- Add constraint for valid content types
ALTER TABLE documents ADD CONSTRAINT chk_content_type 
    CHECK (content_type IN ('text', 'canvas', 'hybrid'));

-- Create index for content_type queries
CREATE INDEX idx_documents_content_type ON documents(content_type);

-- Create GIN index for efficient JSONB queries on canvas data
CREATE INDEX idx_documents_canvas_data ON documents USING gin(canvas_data);

-- Add comment for documentation
COMMENT ON COLUMN documents.canvas_data IS 'Stores tldraw canvas state as JSON (shapes, pages, bindings, etc.)';
COMMENT ON COLUMN documents.content_type IS 'Document type: text (markdown/rich text), canvas (drawing), or hybrid (both)';