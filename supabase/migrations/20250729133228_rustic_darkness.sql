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
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - HNSW vector index on embedding for similarity search
    - Indexes on user_id, project_id for filtering
    - Full-text search index on text
    - GIN index on tags for tag filtering

  3. Security
    - Enable RLS on `memory_items` table
    - Add policies for authenticated users to manage their own memories
    - Add policies for project-based access control

  4. Functions
    - Vector similarity search function
    - Memory statistics function
    - Cleanup function for old memories

  5. Triggers
    - Auto-update updated_at timestamp
*/

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memory_items table with vector embeddings support
CREATE TABLE IF NOT EXISTS memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) > 0 AND length(text) <= 10000),
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE memory_items IS 'Stores user memory items with vector embeddings for semantic search';
COMMENT ON COLUMN memory_items.id IS 'Unique identifier for the memory item';
COMMENT ON COLUMN memory_items.user_id IS 'Foreign key to auth.users - owner of the memory';
COMMENT ON COLUMN memory_items.project_id IS 'Optional foreign key to projects table';
COMMENT ON COLUMN memory_items.text IS 'Original text content of the memory (1-10000 characters)';
COMMENT ON COLUMN memory_items.embedding IS '1536-dimensional vector embedding from OpenAI';
COMMENT ON COLUMN memory_items.metadata IS 'Flexible JSON metadata (type, importance, source, etc.)';
COMMENT ON COLUMN memory_items.tags IS 'Array of searchable tags for categorization';
COMMENT ON COLUMN memory_items.created_at IS 'Timestamp when memory was created';
COMMENT ON COLUMN memory_items.updated_at IS 'Timestamp when memory was last updated';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_memory_items_user_id ON memory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_project_id ON memory_items(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_created_at ON memory_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_items_updated_at ON memory_items(updated_at DESC);

-- Vector similarity search index using HNSW algorithm
CREATE INDEX IF NOT EXISTS idx_memory_items_embedding ON memory_items 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text search index on text content for fallback queries
CREATE INDEX IF NOT EXISTS idx_memory_items_text_search ON memory_items 
USING gin(to_tsvector('english', text));

-- GIN index on tags array for efficient tag filtering
CREATE INDEX IF NOT EXISTS idx_memory_items_tags ON memory_items USING gin(tags);

-- Composite index for user + project filtering
CREATE INDEX IF NOT EXISTS idx_memory_items_user_project ON memory_items(user_id, project_id);

-- Enable Row Level Security
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own memory items
CREATE POLICY "Users can manage their own memory items"
  ON memory_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can access memory items through project ownership
CREATE POLICY "Users can access memory items through projects"
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

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_memory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to memory_items table
DROP TRIGGER IF EXISTS update_memory_items_updated_at_trigger ON memory_items;
CREATE TRIGGER update_memory_items_updated_at_trigger
  BEFORE UPDATE ON memory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_items_updated_at();

-- Vector similarity search function with filtering
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
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    m.project_id,
    m.text,
    m.metadata,
    m.tags,
    (1 - (m.embedding <=> query_embedding)) as similarity,
    m.created_at,
    m.updated_at
  FROM memory_items m
  WHERE 
    (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
    AND (1 - (m.embedding <=> query_embedding)) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Memory statistics function for analytics
CREATE OR REPLACE FUNCTION get_memory_stats(
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL,
  days_back int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  total_memories int;
  memories_by_type jsonb;
  memories_by_project jsonb;
  recent_activity jsonb;
  storage_usage jsonb;
BEGIN
  -- Get total memory count
  SELECT COUNT(*) INTO total_memories
  FROM memory_items m
  WHERE 
    (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
    AND m.created_at >= now() - interval '1 day' * days_back;

  -- Get memories by type from metadata
  SELECT jsonb_object_agg(
    COALESCE(m.metadata->>'type', 'unknown'),
    count
  ) INTO memories_by_type
  FROM (
    SELECT 
      COALESCE(metadata->>'type', 'unknown') as type,
      COUNT(*) as count
    FROM memory_items m
    WHERE 
      (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
      AND m.created_at >= now() - interval '1 day' * days_back
    GROUP BY COALESCE(metadata->>'type', 'unknown')
  ) m;

  -- Get memories by project
  SELECT jsonb_object_agg(
    COALESCE(p.name, 'No Project'),
    count
  ) INTO memories_by_project
  FROM (
    SELECT 
      m.project_id,
      COUNT(*) as count
    FROM memory_items m
    WHERE 
      (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
      AND m.created_at >= now() - interval '1 day' * days_back
    GROUP BY m.project_id
  ) m
  LEFT JOIN projects p ON p.id = m.project_id;

  -- Get recent activity (daily counts)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'count', count
    )
  ) INTO recent_activity
  FROM (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM memory_items m
    WHERE 
      (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
      AND m.created_at >= now() - interval '1 day' * days_back
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  ) daily_counts;

  -- Calculate storage usage
  SELECT jsonb_build_object(
    'total_items', COUNT(*),
    'total_text_length', SUM(length(text)),
    'avg_text_length', AVG(length(text)),
    'total_tags', SUM(array_length(tags, 1))
  ) INTO storage_usage
  FROM memory_items m
  WHERE 
    (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR m.project_id = filter_project_id);

  -- Build final result
  result := jsonb_build_object(
    'total_memories', total_memories,
    'memories_by_type', COALESCE(memories_by_type, '{}'::jsonb),
    'memories_by_project', COALESCE(memories_by_project, '{}'::jsonb),
    'recent_activity', COALESCE(recent_activity, '[]'::jsonb),
    'storage_usage', COALESCE(storage_usage, '{}'::jsonb),
    'period_days', days_back,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- Cleanup function for old memories (maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_memories(
  days_to_keep int DEFAULT 365,
  max_memories_per_user int DEFAULT 10000
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int := 0;
  result jsonb;
BEGIN
  -- Delete memories older than specified days
  WITH deleted_old AS (
    DELETE FROM memory_items
    WHERE created_at < now() - interval '1 day' * days_to_keep
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_old;

  -- Delete excess memories per user (keep most recent)
  WITH user_excess AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM memory_items
  ),
  deleted_excess AS (
    DELETE FROM memory_items
    WHERE id IN (
      SELECT id FROM user_excess WHERE rn > max_memories_per_user
    )
    RETURNING id
  )
  SELECT deleted_count + COUNT(*) INTO deleted_count FROM deleted_excess;

  -- Return cleanup results
  result := jsonb_build_object(
    'deleted_count', deleted_count,
    'cleanup_date', now(),
    'days_kept', days_to_keep,
    'max_per_user', max_memories_per_user
  );

  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON memory_items TO authenticated;
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_memories TO service_role;