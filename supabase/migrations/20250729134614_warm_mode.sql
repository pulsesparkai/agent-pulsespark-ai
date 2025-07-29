/*
  # Create feedback system for AI responses

  1. New Tables
    - `feedback_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `chat_session_id` (uuid, nullable)
      - `ai_response_id` (text, identifier for AI response)
      - `ai_provider` (text, AI provider name)
      - `rating_type` (text, type of rating)
      - `rating_value` (integer, rating value)
      - `feedback_text` (text, optional feedback text)
      - `response_context` (jsonb, context about the AI response)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on feedback_entries table
    - Add policies for users to manage their own feedback

  3. Indexes
    - Index on user_id for efficient user feedback queries
    - Index on ai_provider for provider analytics
    - Index on created_at for temporal analysis

  4. Functions
    - Feedback statistics and analytics functions
*/

-- Create feedback_entries table with proper auth.users reference
CREATE TABLE IF NOT EXISTS feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  chat_session_id uuid,
  ai_response_id text NOT NULL,
  ai_provider text NOT NULL CHECK (ai_provider = ANY (ARRAY['OpenAI'::text, 'Claude'::text, 'DeepSeek'::text, 'Grok'::text, 'Mistral'::text])),
  rating_type text NOT NULL CHECK (rating_type = ANY (ARRAY['thumbs'::text, 'stars'::text, 'scale'::text])),
  rating_value integer NOT NULL,
  feedback_text text,
  response_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comprehensive comments for documentation
COMMENT ON TABLE feedback_entries IS 'User feedback for AI responses with ratings and context';
COMMENT ON COLUMN feedback_entries.id IS 'Unique identifier for the feedback entry';
COMMENT ON COLUMN feedback_entries.user_id IS 'Foreign key reference to auth.users(id) - feedback author';
COMMENT ON COLUMN feedback_entries.project_id IS 'Optional foreign key to projects(id) for project context';
COMMENT ON COLUMN feedback_entries.chat_session_id IS 'Optional reference to chat session';
COMMENT ON COLUMN feedback_entries.ai_response_id IS 'Identifier for the AI response being rated';
COMMENT ON COLUMN feedback_entries.ai_provider IS 'AI provider that generated the response';
COMMENT ON COLUMN feedback_entries.rating_type IS 'Type of rating system used (thumbs, stars, scale)';
COMMENT ON COLUMN feedback_entries.rating_value IS 'Numeric rating value';
COMMENT ON COLUMN feedback_entries.feedback_text IS 'Optional textual feedback from user';
COMMENT ON COLUMN feedback_entries.response_context IS 'JSON context about the AI response';
COMMENT ON COLUMN feedback_entries.created_at IS 'Feedback creation timestamp';
COMMENT ON COLUMN feedback_entries.updated_at IS 'Last modification timestamp';

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_id 
  ON feedback_entries(user_id);
COMMENT ON INDEX idx_feedback_entries_user_id IS 'Fast user-based feedback filtering';

CREATE INDEX IF NOT EXISTS idx_feedback_entries_ai_provider 
  ON feedback_entries(ai_provider);
COMMENT ON INDEX idx_feedback_entries_ai_provider IS 'Provider-based analytics and filtering';

CREATE INDEX IF NOT EXISTS idx_feedback_entries_created_at 
  ON feedback_entries(created_at DESC);
COMMENT ON INDEX idx_feedback_entries_created_at IS 'Temporal feedback analysis';

CREATE INDEX IF NOT EXISTS idx_feedback_entries_project_id 
  ON feedback_entries(project_id) WHERE project_id IS NOT NULL;
COMMENT ON INDEX idx_feedback_entries_project_id IS 'Project-based feedback filtering';

-- Composite index for user + provider queries
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_provider 
  ON feedback_entries(user_id, ai_provider);
COMMENT ON INDEX idx_feedback_entries_user_provider IS 'User and provider composite filtering';

-- Enable Row Level Security
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own feedback
CREATE POLICY "Users can manage their own feedback"
  ON feedback_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can access feedback through project ownership
CREATE POLICY "Users can access feedback through project ownership"
  ON feedback_entries
  FOR SELECT
  TO authenticated
  USING (
    project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = feedback_entries.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger function for automatic updated_at updates
CREATE OR REPLACE FUNCTION update_feedback_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to feedback_entries table
CREATE TRIGGER update_feedback_entries_updated_at_trigger
  BEFORE UPDATE ON feedback_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_entries_updated_at();

-- Feedback statistics function
CREATE OR REPLACE FUNCTION get_feedback_stats(
  filter_user_id uuid,
  filter_project_id uuid DEFAULT NULL,
  filter_provider text DEFAULT NULL,
  days_back int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'total_feedback', COUNT(*),
    'average_rating', AVG(rating_value),
    'rating_distribution', jsonb_object_agg(
      rating_value::text, 
      rating_count
    ),
    'provider_stats', jsonb_object_agg(
      ai_provider,
      jsonb_build_object(
        'count', provider_count,
        'avg_rating', provider_avg_rating
      )
    ),
    'period_days', days_back,
    'generated_at', now()
  )
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY rating_value) as rating_count,
      COUNT(*) OVER (PARTITION BY ai_provider) as provider_count,
      AVG(rating_value) OVER (PARTITION BY ai_provider) as provider_avg_rating
    FROM feedback_entries
    WHERE user_id = filter_user_id
      AND (filter_project_id IS NULL OR project_id = filter_project_id)
      AND (filter_provider IS NULL OR ai_provider = filter_provider)
      AND created_at >= now() - interval '1 day' * days_back
  ) stats;
$$;

COMMENT ON FUNCTION get_feedback_stats IS 'Generate comprehensive feedback statistics and analytics';

-- Feedback trends function
CREATE OR REPLACE FUNCTION get_feedback_trends(
  filter_user_id uuid,
  filter_project_id uuid DEFAULT NULL,
  days_back int DEFAULT 30,
  interval_days int DEFAULT 1
)
RETURNS TABLE (
  date date,
  feedback_count bigint,
  average_rating numeric
)
LANGUAGE sql STABLE
AS $$
  SELECT
    date_trunc('day', created_at)::date as date,
    COUNT(*) as feedback_count,
    AVG(rating_value) as average_rating
  FROM feedback_entries
  WHERE user_id = filter_user_id
    AND (filter_project_id IS NULL OR project_id = filter_project_id)
    AND created_at >= now() - interval '1 day' * days_back
  GROUP BY date_trunc('day', created_at)
  ORDER BY date DESC;
$$;

COMMENT ON FUNCTION get_feedback_trends IS 'Generate time-series feedback trends for analytics';