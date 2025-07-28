/*
  # Custom Memory System with Vector Embeddings

  1. New Tables
    - `memory_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `text` (text, the original text content)
      - `embedding` (vector(1536), OpenAI embedding vector)
      - `metadata` (jsonb, flexible metadata storage)
      - `tags` (text array, searchable tags)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Indexes
    - Vector similarity search index using HNSW
    - User and project filtering indexes
    - Text search index for fallback queries

  3. Security
    - Enable RLS on `memory_items` table
    - Add policies for user isolation
    - Add policies for project-based access

  4. Functions
    - Similarity search function with user/project filtering
    - Memory cleanup function for old entries
*/

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memory_items table with vector embeddings
CREATE TABLE IF NOT EXISTS memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI embedding dimension
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_memory_items_user_id ON memory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_project_id ON memory_items(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_created_at ON memory_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_items_tags ON memory_items USING GIN(tags);

-- Create vector similarity search index using HNSW (Hierarchical Navigable Small World)
CREATE INDEX IF NOT EXISTS idx_memory_items_embedding ON memory_items 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
CREATE POLICY "Users can manage their own memories"
  ON memory_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for project-based access
CREATE POLICY "Users can access project memories they own"
  ON memory_items
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = memory_items.project_id 
      AND projects.user_id = auth.uid()
    ))
  );

-- Create function for similarity search with user/project filtering
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
    1 - (memory_items.embedding <=> query_embedding) AS similarity,
    memory_items.created_at
  FROM memory_items
  WHERE 
    (filter_user_id IS NULL OR memory_items.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR memory_items.project_id = filter_project_id)
    AND 1 - (memory_items.embedding <=> query_embedding) > match_threshold
  ORDER BY memory_items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to clean up old memories (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_memories(
  days_old int DEFAULT 90,
  max_memories_per_user int DEFAULT 1000
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int := 0;
BEGIN
  -- Delete memories older than specified days
  DELETE FROM memory_items 
  WHERE created_at < now() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Keep only the most recent memories per user if over limit
  WITH ranked_memories AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM memory_items
  )
  DELETE FROM memory_items 
  WHERE id IN (
    SELECT id FROM ranked_memories WHERE rn > max_memories_per_user
  );
  
  RETURN deleted_count;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memory_items_updated_at
  BEFORE UPDATE ON memory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_updated_at();