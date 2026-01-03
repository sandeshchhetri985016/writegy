-- Add hierarchical document structure (tree view)
ALTER TABLE documents ADD COLUMN parent_id BIGINT;
ALTER TABLE documents ADD COLUMN tree_order INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN depth INTEGER DEFAULT 0;

-- Add foreign key constraint for parent-child relationships
ALTER TABLE documents ADD CONSTRAINT fk_documents_parent
    FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE;

-- Add index for better tree query performance
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_documents_tree_order ON documents(tree_order);
CREATE INDEX idx_documents_depth ON documents(depth);

-- Update existing documents to have depth 0 (root level)
UPDATE documents SET depth = 0 WHERE depth IS NULL;
