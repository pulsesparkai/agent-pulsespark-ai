@@ .. @@
 /*
   # Create Custom Memory System with Vector Embeddings

   1. New Tables
     - `memory_items`
       - `id` (uuid, primary key)
-      - `user_id` (uuid, foreign key to users)
+      - `user_id` (uuid, foreign key to auth.users)
       - `project_id` (uuid, foreign key to projects, nullable)
       - `text` (text, stores original content)
       - `embedding` (vector(1536), OpenAI embedding)
       - `metadata` (jsonb, flexible metadata)
       - `tags` (text[], searchable tags)
       - `created_at` (timestamptz)
       - `updated_at` (timestamptz)
   2. Security
     - Enable RLS on `memory_items` table
     - Add policies for authenticated users to manage their own memories
   3. Functions
     - Vector similarity search function
     - Memory statistics and analytics
     - Cleanup and maintenance functions
   4. Indexes
     - HNSW vector index for similarity search
     - Composite indexes for user and project filtering
     - Full-text search index for fallback queries
 */

 -- Enable the pgvector extension for vector operations
 CREATE EXTENSION IF NOT EXISTS vector;

 -- Create memory_items table with vector embeddings support
 CREATE TABLE IF NOT EXISTS memory_items (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
-  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
+  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-COMMENT ON COLUMN memory_items.user_id IS 'Foreign key reference to users table';
+COMMENT ON COLUMN memory_items.user_id IS 'Foreign key reference to auth.users table';
 COMMENT ON COLUMN memory_items.project_id IS 'Optional foreign key reference to projects table';
 COMMENT ON COLUMN memory_items.text IS 'Original text content of the memory item';
 COMMENT ON COLUMN memory_items.embedding IS '1536-dimensional vector embedding from OpenAI';
 COMMENT ON COLUMN memory_items.metadata IS 'Flexible JSON metadata for additional context';
 COMMENT ON COLUMN memory_items.tags IS 'Array of searchable tags for categorization';
 COMMENT ON COLUMN memory_items.created_at IS 'Timestamp when the memory item was created';
 COMMENT ON COLUMN memory_items.updated_at IS 'Timestamp when the memory item was last updated';

 -- Create indexes for optimal performance
 
 -- HNSW index for vector similarity search using cosine distance
 CREATE INDEX IF NOT EXISTS idx_memory_items_embedding_cosine 
   ON memory_items USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);

 -- Composite index for user-based queries
 CREATE INDEX IF NOT EXISTS idx_memory_items_user_created 
   ON memory_items (user_id, created_at DESC);

 -- Index for project-based filtering
 CREATE INDEX IF NOT EXISTS idx_memory_items_project 
   ON memory_items (project_id) WHERE project_id IS NOT NULL;

 -- GIN index for full-text search on text content
 CREATE INDEX IF NOT EXISTS idx_memory_items_text_search 
   ON memory_items USING gin (to_tsvector('english', text));

 -- GIN index for tag-based searches
 CREATE INDEX IF NOT EXISTS idx_memory_items_tags 
   ON memory_items USING gin (tags);

 -- Composite index for user and project filtering
 CREATE INDEX IF NOT EXISTS idx_memory_items_user_project 
   ON memory_items (user_id, project_id) WHERE project_id IS NOT NULL;

 -- Add comments to indexes
 COMMENT ON INDEX idx_memory_items_embedding_cosine IS 'HNSW index for fast vector similarity search';
 COMMENT ON INDEX idx_memory_items_user_created IS 'Composite index for user-based queries ordered by creation date';
 COMMENT ON INDEX idx_memory_items_project IS 'Index for project-based memory filtering';
 COMMENT ON INDEX idx_memory_items_text_search IS 'Full-text search index for fallback text queries';
 COMMENT ON INDEX idx_memory_items_tags IS 'GIN index for efficient tag-based searches';
 COMMENT ON INDEX idx_memory_items_user_project IS 'Composite index for user and project filtering';

 -- Enable Row Level Security
 ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

 -- Create RLS policies for secure access

 -- Policy: Users can only access their own memory items
 CREATE POLICY "Users can manage their own memory items"
   ON memory_items
   FOR ALL
   TO authenticated
-  USING (auth.uid() = user_id)
-  WITH CHECK (auth.uid() = user_id);
+  USING (auth.uid() = user_id)
+  WITH CHECK (auth.uid() = user_id);

 -- Policy: Users can access memory items from projects they own
 CREATE POLICY "Users can access memory items from owned projects"
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

 -- Create trigger function for updating updated_at timestamp
 CREATE OR REPLACE FUNCTION update_memory_items_updated_at()
 RETURNS TRIGGER AS $$
 BEGIN
   NEW.updated_at = now();
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;

 -- Add comment to trigger function
 COMMENT ON FUNCTION update_memory_items_updated_at() IS 'Trigger function to automatically update updated_at timestamp';

 -- Create trigger to automatically update updated_at on row updates
 CREATE TRIGGER update_memory_items_updated_at_trigger
   BEFORE UPDATE ON memory_items
   FOR EACH ROW
   EXECUTE FUNCTION update_memory_items_updated_at();

 -- Add comment to trigger
 COMMENT ON TRIGGER update_memory_items_updated_at_trigger ON memory_items IS 'Automatically updates updated_at timestamp on row updates';

 -- Create function for vector similarity search with filtering
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
 SECURITY DEFINER
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
     (1 - (m.embedding <=> query_embedding)) > match_threshold
     AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
     AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
   ORDER BY m.embedding <=> query_embedding
   LIMIT match_count;
 END;
 $$;

 -- Add comment to search function
 COMMENT ON FUNCTION search_memories IS 'Performs vector similarity search on memory items with optional filtering';

 -- Create function for memory statistics and analytics
 CREATE OR REPLACE FUNCTION get_memory_stats(
   filter_user_id uuid DEFAULT NULL,
   filter_project_id uuid DEFAULT NULL,
   days_back int DEFAULT 30
 )
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
   SELECT COUNT(*)
   INTO total_memories
   FROM memory_items m
   WHERE 
     (filter_user_id IS NULL OR m.user_id = filter_user_id)
     AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
     AND m.created_at >= now() - interval '1 day' * days_back;

   -- Get memories by type from metadata
   SELECT jsonb_object_agg(
     COALESCE(m.metadata->>'type', 'unknown'),
     count
   )
   INTO memories_by_type
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
   )
   INTO memories_by_project
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
   )
   INTO recent_activity
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
   )
   INTO storage_usage
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

 -- Add comment to stats function
 COMMENT ON FUNCTION get_memory_stats IS 'Generates comprehensive statistics and analytics for memory usage';

 -- Create function for cleaning up old memories (maintenance)
 CREATE OR REPLACE FUNCTION cleanup_old_memories(
   retention_days int DEFAULT 365,
   max_memories_per_user int DEFAULT 10000
 )
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $$
 DECLARE
   deleted_count int := 0;
   result jsonb;
 BEGIN
   -- Delete memories older than retention period
   WITH deleted_old AS (
     DELETE FROM memory_items
     WHERE created_at < now() - interval '1 day' * retention_days
     RETURNING id
   )
   SELECT COUNT(*) INTO deleted_count FROM deleted_old;

   -- For each user, keep only the most recent memories up to the limit
   WITH user_memory_counts AS (
     SELECT 
       user_id,
       COUNT(*) as memory_count
     FROM memory_items
     GROUP BY user_id
     HAVING COUNT(*) > max_memories_per_user
   ),
   memories_to_delete AS (
     SELECT m.id
     FROM memory_items m
     INNER JOIN user_memory_counts umc ON umc.user_id = m.user_id
     WHERE m.id NOT IN (
       SELECT id
       FROM memory_items m2
       WHERE m2.user_id = m.user_id
       ORDER BY m2.created_at DESC
       LIMIT max_memories_per_user
     )
   ),
   deleted_excess AS (
     DELETE FROM memory_items
     WHERE id IN (SELECT id FROM memories_to_delete)
     RETURNING id
   )
   SELECT deleted_count + COUNT(*) INTO deleted_count FROM deleted_excess;

   -- Build result
   result := jsonb_build_object(
     'deleted_count', deleted_count,
     'retention_days', retention_days,
     'max_memories_per_user', max_memories_per_user,
     'cleaned_at', now()
   );

   RETURN result;
 END;
 $$;

 -- Add comment to cleanup function
 COMMENT ON FUNCTION cleanup_old_memories IS 'Maintenance function to clean up old memories and enforce user limits';