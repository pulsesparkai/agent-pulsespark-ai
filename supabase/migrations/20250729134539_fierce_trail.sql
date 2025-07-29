/*
  # Custom Memory System with Vector Embeddings

  1. New Tables
    - `memory_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `text` (text, original content)
      - `embedding` (vector(1536), OpenAI embedding)
      - `metadata` (jsonb, flexible metadata)
      - `tags` (text[], searchable tags)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Indexes
    - HNSW vector similarity search index on embedding
    - User and project filtering indexes
    - Full-text search index on text
    - Tag search index

  3. Security
    - Enable RLS on memory_items table
    - Policies for user and project-based access

  4. Functions
    - Vector similarity search function
    - Memory statistics function
    - Cleanup and maintenance functions

  5. Triggers
    - Auto-update updated_at timestamp
*/

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memory_items table with proper auth.users reference
CREATE TABLE IF NOT EXISTS memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comprehensive comments for documentation
COMMENT ON TABLE memory_items IS 'Vector-based memory storage for intelligent context retrieval';
COMMENT ON COLUMN memory_items.id IS 'Unique identifier for the memory item';
COMMENT ON COLUMN memory_items.user_id IS 'Foreign key reference to auth.users(id) - owner of the memory';
COMMENT ON COLUMN memory_items.project_id IS 'Optional foreign key to projects(id) for project-specific memories';
COMMENT ON COLUMN memory_items.text IS 'Original text content stored in the memory';
COMMENT ON COLUMN memory_items.embedding IS '1536-dimensional vector embedding for semantic search';
COMMENT ON COLUMN memory_items.metadata IS 'Flexible JSON metadata (type, importance, source, etc.)';
COMMENT ON COLUMN memory_items.tags IS 'Array of searchable tags for categorization';
COMMENT ON COLUMN memory_items.created_at IS 'Memory creation timestamp';
COMMENT ON COLUMN memory_items.updated_at IS 'Last modification timestamp';

-- Create performance-optimized indexes
CREATE INDEX IF NOT EXISTS idx_memory_items_user_id 
  ON memory_items(user_id);
COMMENT ON INDEX idx_memory_items_user_id IS 'Fast user-based memory filtering';

CREATE INDEX IF NOT EXISTS idx_memory_items_project_id 
  ON memory_items(project_id) WHERE project_id IS NOT NULL;
COMMENT ON INDEX idx_memory_items_project_id IS 'Fast project-based memory filtering';

CREATE INDEX IF NOT EXISTS idx_memory_items_created_at 
  ON memory_items(created_at DESC);
COMMENT ON INDEX idx_memory_items_created_at IS 'Chronological memory ordering';

-- Vector similarity search index using HNSW algorithm
CREATE INDEX IF NOT EXISTS idx_memory_items_embedding_cosine 
  ON memory_items USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
COMMENT ON INDEX idx_memory_items_embedding_cosine IS 'HNSW index for fast vector similarity search using cosine distance';

-- Full-text search index for fallback text search
CREATE INDEX IF NOT EXISTS idx_memory_items_text_search 
  ON memory_items USING gin (to_tsvector('english', text));
COMMENT ON INDEX idx_memory_items_text_search IS 'Full-text search index for keyword-based memory retrieval';

-- Tag search index for efficient tag filtering
CREATE INDEX IF NOT EXISTS idx_memory_items_tags 
  ON memory_items USING gin (tags);
COMMENT ON INDEX idx_memory_items_tags IS 'GIN index for efficient tag-based filtering';

-- Composite index for user + project queries
CREATE INDEX IF NOT EXISTS idx_memory_items_user_project 
  ON memory_items(user_id, project_id);
COMMENT ON INDEX idx_memory_items_user_project IS 'Composite index for user and project filtering';

-- Enable Row Level Security
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own memories
CREATE POLICY "Users can manage their own memories"
  ON memory_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can access memories through project ownership
CREATE POLICY "Users can access memories through project ownership"
  ON memory_items
  FOR SELECT
  TO authenticated
  USING (
    project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = memory_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger function for automatic updated_at updates
CREATE OR REPLACE FUNCTION update_memory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to memory_items table
CREATE TRIGGER update_memory_items_updated_at_trigger
  BEFORE UPDATE ON memory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_items_updated_at();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  project_id uuid,
  text text,
  metadata jsonb,
  tags text[],
  similarity float,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    memory_items.id,
    memory_items.user_id,
    memory_items.project_id,
    memory_items.text,
    memory_items.metadata,
    memory_items.tags,
    1 - (memory_items.embedding <=> query_embedding) AS similarity,
    memory_items.created_at,
    memory_items.updated_at
  FROM memory_items
  WHERE 
    (filter_user_id IS NULL OR memory_items.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR memory_items.project_id = filter_project_id)
    AND 1 - (memory_items.embedding <=> query_embedding) > match_threshold
  ORDER BY memory_items.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION search_memories IS 'Semantic similarity search using vector embeddings with user and project filtering';

-- Memory statistics function
CREATE OR REPLACE FUNCTION get_memory_stats(
  filter_user_id uuid,
  filter_project_id uuid DEFAULT NULL,
  days_back int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'total_memories', COUNT(*),
    'memories_by_type', jsonb_object_agg(
      COALESCE(metadata->>'type', 'unknown'), 
      type_count
    ),
    'memories_by_project', jsonb_object_agg(
      COALESCE(project_id::text, 'no_project'), 
      project_count
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date_trunc('day', created_at)::date,
          'count', daily_count
        )
      )
      FROM (
        SELECT 
          created_at,
          COUNT(*) as daily_count
        FROM memory_items
        WHERE user_id = filter_user_id
          AND (filter_project_id IS NULL OR project_id = filter_project_id)
          AND created_at >= now() - interval '1 day' * days_back
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) DESC
        LIMIT 30
      ) daily_stats
    ),
    'storage_usage', jsonb_build_object(
      'total_items', COUNT(*),
      'total_text_length', SUM(length(text)),
      'avg_text_length', AVG(length(text))
    )
  )
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY COALESCE(metadata->>'type', 'unknown')) as type_count,
      COUNT(*) OVER (PARTITION BY COALESCE(project_id::text, 'no_project')) as project_count
    FROM memory_items
    WHERE user_id = filter_user_id
      AND (filter_project_id IS NULL OR project_id = filter_project_id)
  ) stats;
$$;

COMMENT ON FUNCTION get_memory_stats IS 'Generate comprehensive memory usage statistics and analytics';

-- Cleanup function for memory maintenance
CREATE OR REPLACE FUNCTION cleanup_old_memories(
  user_id_param uuid,
  days_old int DEFAULT 365,
  max_memories_per_user int DEFAULT 10000
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Delete memories older than specified days
  WITH deleted AS (
    DELETE FROM memory_items
    WHERE user_id = user_id_param
      AND created_at < now() - interval '1 day' * days_old
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- If user still has too many memories, delete oldest ones
  IF (SELECT COUNT(*) FROM memory_items WHERE user_id = user_id_param) > max_memories_per_user THEN
    WITH excess_memories AS (
      SELECT id
      FROM memory_items
      WHERE user_id = user_id_param
      ORDER BY created_at DESC
      OFFSET max_memories_per_user
    ),
    deleted_excess AS (
      DELETE FROM memory_items
      WHERE id IN (SELECT id FROM excess_memories)
      RETURNING id
    )
    SELECT deleted_count + COUNT(*) INTO deleted_count FROM deleted_excess;
  END IF;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_memories IS 'Cleanup old memories for performance and storage management';