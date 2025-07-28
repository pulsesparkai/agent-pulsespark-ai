/*
  # Custom Memory System with Vector Embeddings

  1. New Tables
    - `memory_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, nullable, foreign key to projects)
      - `text` (text, original content)
      - `embedding` (vector(1536), OpenAI embedding)
      - `metadata` (jsonb, flexible metadata)
      - `tags` (text[], searchable tags)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `memory_items` table
    - Add policies for user-based access control
    - Add policies for project-based access control

  3. Performance
    - HNSW index for vector similarity search
    - B-tree indexes for user_id and project_id filtering
    - GIN index for full-text search on text content
    - GIN index for tags array search

  4. Triggers
    - Auto-update updated_at timestamp on row changes
*/

-- Enable the vector extension for pgvector support
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the memory_items table with comprehensive structure
CREATE TABLE IF NOT EXISTS memory_items (
  -- Primary identifier
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User association with cascade delete for data cleanup
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Optional project association with cascade delete
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Original text content for the memory item
  text text NOT NULL,
  
  -- Vector embedding (1536 dimensions for OpenAI text-embedding-ada-002)
  embedding vector(1536) NOT NULL,
  
  -- Flexible metadata storage for additional context
  metadata jsonb DEFAULT '{}' NOT NULL,
  
  -- Searchable tags for categorization and filtering
  tags text[] DEFAULT '{}' NOT NULL,
  
  -- Timestamp tracking for creation and updates
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add comprehensive comments for documentation
COMMENT ON TABLE memory_items IS 'Stores user memory items with vector embeddings for semantic search';
COMMENT ON COLUMN memory_items.id IS 'Unique identifier for the memory item';
COMMENT ON COLUMN memory_items.user_id IS 'Reference to the user who owns this memory item';
COMMENT ON COLUMN memory_items.project_id IS 'Optional reference to associated project';
COMMENT ON COLUMN memory_items.text IS 'Original text content of the memory item';
COMMENT ON COLUMN memory_items.embedding IS 'Vector embedding (1536 dimensions) for semantic similarity search';
COMMENT ON COLUMN memory_items.metadata IS 'Flexible JSON metadata for additional context and categorization';
COMMENT ON COLUMN memory_items.tags IS 'Array of searchable tags for categorization and filtering';
COMMENT ON COLUMN memory_items.created_at IS 'Timestamp when the memory item was created';
COMMENT ON COLUMN memory_items.updated_at IS 'Timestamp when the memory item was last updated';

-- Create performance indexes for efficient querying

-- HNSW index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_memory_items_embedding_hnsw 
ON memory_items 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
COMMENT ON INDEX idx_memory_items_embedding_hnsw IS 'HNSW index for fast vector similarity search using cosine distance';

-- B-tree index for user-based filtering
CREATE INDEX IF NOT EXISTS idx_memory_items_user_id 
ON memory_items (user_id);
COMMENT ON INDEX idx_memory_items_user_id IS 'Index for fast user-based memory filtering';

-- B-tree index for project-based filtering
CREATE INDEX IF NOT EXISTS idx_memory_items_project_id 
ON memory_items (project_id);
COMMENT ON INDEX idx_memory_items_project_id IS 'Index for fast project-based memory filtering';

-- Composite index for user and project filtering
CREATE INDEX IF NOT EXISTS idx_memory_items_user_project 
ON memory_items (user_id, project_id);
COMMENT ON INDEX idx_memory_items_user_project IS 'Composite index for user and project filtering';

-- GIN index for full-text search on text content (fallback search)
CREATE INDEX IF NOT EXISTS idx_memory_items_text_search 
ON memory_items 
USING gin (to_tsvector('english', text));
COMMENT ON INDEX idx_memory_items_text_search IS 'Full-text search index for fallback text-based queries';

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_memory_items_tags 
ON memory_items 
USING gin (tags);
COMMENT ON INDEX idx_memory_items_tags IS 'GIN index for efficient tag-based filtering and search';

-- B-tree index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_memory_items_created_at 
ON memory_items (created_at DESC);
COMMENT ON INDEX idx_memory_items_created_at IS 'Index for chronological memory retrieval';

-- Enable Row Level Security for data isolation
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user-based access control
CREATE POLICY "Users can manage their own memory items"
ON memory_items
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for project-based access control
CREATE POLICY "Users can access memory items from their projects"
ON memory_items
FOR SELECT
TO authenticated
USING (
  project_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = memory_items.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_memory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the updated_at timestamp to current time
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the trigger function
COMMENT ON FUNCTION update_memory_items_updated_at() IS 'Trigger function to automatically update updated_at timestamp on memory_items changes';

-- Attach the trigger to the memory_items table
CREATE TRIGGER update_memory_items_updated_at_trigger
  BEFORE UPDATE ON memory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_items_updated_at();

-- Create helper function for memory similarity search
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  text text,
  metadata jsonb,
  tags text[],
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    memory_items.id,
    memory_items.text,
    memory_items.metadata,
    memory_items.tags,
    (1 - (memory_items.embedding <=> query_embedding)) as similarity,
    memory_items.created_at
  FROM memory_items
  WHERE 
    (filter_user_id IS NULL OR memory_items.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR memory_items.project_id = filter_project_id)
    AND (1 - (memory_items.embedding <=> query_embedding)) > match_threshold
  ORDER BY memory_items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment to the search function
COMMENT ON FUNCTION search_memories IS 'Performs vector similarity search on memory items with optional filtering';

-- Create function to get memory statistics
CREATE OR REPLACE FUNCTION get_memory_stats(
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_memories bigint,
  memories_by_type jsonb,
  avg_text_length numeric,
  total_tags bigint,
  unique_tags bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_memories,
    jsonb_object_agg(
      COALESCE(metadata->>'type', 'unknown'), 
      type_count
    ) as memories_by_type,
    AVG(LENGTH(text))::numeric as avg_text_length,
    SUM(array_length(tags, 1))::bigint as total_tags,
    COUNT(DISTINCT unnest(tags))::bigint as unique_tags
  FROM (
    SELECT 
      metadata,
      text,
      tags,
      COUNT(*) as type_count
    FROM memory_items
    WHERE 
      (filter_user_id IS NULL OR user_id = filter_user_id)
      AND (filter_project_id IS NULL OR project_id = filter_project_id)
    GROUP BY metadata->>'type', metadata, text, tags
  ) grouped_memories;
END;
$$;

-- Add comment to the stats function
COMMENT ON FUNCTION get_memory_stats IS 'Generates statistics about memory items for analytics and insights';

-- Create function for memory cleanup (remove old or low-importance memories)
CREATE OR REPLACE FUNCTION cleanup_old_memories(
  days_old int DEFAULT 365,
  max_memories_per_user int DEFAULT 10000
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int := 0;
BEGIN
  -- Delete memories older than specified days with low importance
  DELETE FROM memory_items
  WHERE 
    created_at < (now() - (days_old || ' days')::interval)
    AND (metadata->>'importance')::int < 3;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- For users with too many memories, keep only the most recent ones
  WITH user_memory_counts AS (
    SELECT 
      user_id,
      COUNT(*) as memory_count
    FROM memory_items
    GROUP BY user_id
    HAVING COUNT(*) > max_memories_per_user
  ),
  memories_to_delete AS (
    SELECT mi.id
    FROM memory_items mi
    JOIN user_memory_counts umc ON mi.user_id = umc.user_id
    WHERE mi.id NOT IN (
      SELECT id
      FROM memory_items mi2
      WHERE mi2.user_id = mi.user_id
      ORDER BY 
        (metadata->>'importance')::int DESC NULLS LAST,
        created_at DESC
      LIMIT max_memories_per_user
    )
  )
  DELETE FROM memory_items
  WHERE id IN (SELECT id FROM memories_to_delete);
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Add comment to the cleanup function
COMMENT ON FUNCTION cleanup_old_memories IS 'Cleans up old or excess memory items to maintain performance';