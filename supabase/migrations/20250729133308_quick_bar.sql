/*
  # Feedback Loop System for AI Responses

  1. New Tables
    - `feedback_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `chat_session_id` (uuid, foreign key to chat_sessions, nullable)
      - `ai_response_id` (text, identifier for the AI response)
      - `ai_provider` (text, which AI provider generated the response)
      - `rating_type` (text, type of rating: thumbs, stars, scale)
      - `rating_value` (integer, the actual rating value)
      - `feedback_text` (text, optional textual feedback)
      - `response_context` (jsonb, metadata about the AI response)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on user_id for fast user filtering
    - Index on project_id for project filtering
    - Index on ai_provider for provider analytics
    - Index on created_at for time-based queries
    - Composite indexes for common query patterns

  3. Security
    - Enable RLS on `feedback_entries` table
    - Add policies for authenticated users to manage their own feedback
    - Add policies for project-based access control

  4. Functions
    - Feedback statistics aggregation function
    - Feedback trends analysis function

  5. Triggers
    - Auto-update updated_at timestamp
*/

-- Create feedback_entries table for storing user feedback on AI responses
CREATE TABLE IF NOT EXISTS feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  chat_session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  ai_response_id text NOT NULL,
  ai_provider text NOT NULL CHECK (ai_provider IN ('OpenAI', 'Claude', 'DeepSeek', 'Grok', 'Mistral')),
  rating_type text NOT NULL CHECK (rating_type IN ('thumbs', 'stars', 'scale')),
  rating_value integer NOT NULL,
  feedback_text text,
  response_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints for rating values based on type
  CONSTRAINT valid_thumbs_rating CHECK (
    rating_type != 'thumbs' OR rating_value IN (0, 1)
  ),
  CONSTRAINT valid_stars_rating CHECK (
    rating_type != 'stars' OR (rating_value >= 1 AND rating_value <= 5)
  ),
  CONSTRAINT valid_scale_rating CHECK (
    rating_type != 'scale' OR (rating_value >= 1 AND rating_value <= 10)
  ),
  CONSTRAINT feedback_text_length CHECK (
    feedback_text IS NULL OR (length(feedback_text) >= 5 AND length(feedback_text) <= 1000)
  )
);

-- Add comments for documentation
COMMENT ON TABLE feedback_entries IS 'Stores user feedback on AI-generated responses for continuous improvement';
COMMENT ON COLUMN feedback_entries.id IS 'Unique identifier for the feedback entry';
COMMENT ON COLUMN feedback_entries.user_id IS 'Foreign key to auth.users - user who provided feedback';
COMMENT ON COLUMN feedback_entries.project_id IS 'Optional foreign key to projects table';
COMMENT ON COLUMN feedback_entries.chat_session_id IS 'Optional foreign key to chat_sessions table';
COMMENT ON COLUMN feedback_entries.ai_response_id IS 'Identifier for the specific AI response being rated';
COMMENT ON COLUMN feedback_entries.ai_provider IS 'AI provider that generated the response (OpenAI, Claude, etc.)';
COMMENT ON COLUMN feedback_entries.rating_type IS 'Type of rating system used (thumbs, stars, scale)';
COMMENT ON COLUMN feedback_entries.rating_value IS 'Numeric rating value (0-1 for thumbs, 1-5 for stars, 1-10 for scale)';
COMMENT ON COLUMN feedback_entries.feedback_text IS 'Optional textual feedback (5-1000 characters)';
COMMENT ON COLUMN feedback_entries.response_context IS 'JSON metadata about the AI response context';
COMMENT ON COLUMN feedback_entries.created_at IS 'Timestamp when feedback was created';
COMMENT ON COLUMN feedback_entries.updated_at IS 'Timestamp when feedback was last updated';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_id ON feedback_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_project_id ON feedback_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_ai_provider ON feedback_entries(ai_provider);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_rating_type ON feedback_entries(rating_type);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_created_at ON feedback_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_updated_at ON feedback_entries(updated_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_provider ON feedback_entries(user_id, ai_provider);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_project ON feedback_entries(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_provider_rating ON feedback_entries(ai_provider, rating_value);

-- Enable Row Level Security
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own feedback entries
CREATE POLICY "Users can manage their own feedback entries"
  ON feedback_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can access feedback entries through project ownership
CREATE POLICY "Users can access feedback entries through projects"
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

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to feedback_entries table
DROP TRIGGER IF EXISTS update_feedback_entries_updated_at_trigger ON feedback_entries;
CREATE TRIGGER update_feedback_entries_updated_at_trigger
  BEFORE UPDATE ON feedback_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_entries_updated_at();

-- Feedback statistics aggregation function
CREATE OR REPLACE FUNCTION get_feedback_stats(
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL,
  filter_provider text DEFAULT NULL,
  days_back int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  total_feedback int;
  average_rating numeric;
  rating_distribution jsonb;
  provider_stats jsonb;
BEGIN
  -- Get total feedback count
  SELECT COUNT(*) INTO total_feedback
  FROM feedback_entries f
  WHERE 
    (filter_user_id IS NULL OR f.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR f.project_id = filter_project_id)
    AND (filter_provider IS NULL OR f.ai_provider = filter_provider)
    AND f.created_at >= now() - interval '1 day' * days_back;

  -- Calculate average rating (normalized to 0-1 scale)
  SELECT AVG(
    CASE 
      WHEN rating_type = 'thumbs' THEN rating_value::numeric
      WHEN rating_type = 'stars' THEN (rating_value - 1)::numeric / 4
      WHEN rating_type = 'scale' THEN (rating_value - 1)::numeric / 9
      ELSE 0
    END
  ) INTO average_rating
  FROM feedback_entries f
  WHERE 
    (filter_user_id IS NULL OR f.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR f.project_id = filter_project_id)
    AND (filter_provider IS NULL OR f.ai_provider = filter_provider)
    AND f.created_at >= now() - interval '1 day' * days_back;

  -- Get rating distribution by value
  SELECT jsonb_object_agg(
    rating_value::text,
    count
  ) INTO rating_distribution
  FROM (
    SELECT 
      rating_value,
      COUNT(*) as count
    FROM feedback_entries f
    WHERE 
      (filter_user_id IS NULL OR f.user_id = filter_user_id)
      AND (filter_project_id IS NULL OR f.project_id = filter_project_id)
      AND (filter_provider IS NULL OR f.ai_provider = filter_provider)
      AND f.created_at >= now() - interval '1 day' * days_back
    GROUP BY rating_value
    ORDER BY rating_value
  ) dist;

  -- Get statistics by AI provider
  SELECT jsonb_object_agg(
    ai_provider,
    jsonb_build_object(
      'count', count,
      'avg_rating', avg_rating
    )
  ) INTO provider_stats
  FROM (
    SELECT 
      ai_provider,
      COUNT(*) as count,
      AVG(
        CASE 
          WHEN rating_type = 'thumbs' THEN rating_value::numeric
          WHEN rating_type = 'stars' THEN (rating_value - 1)::numeric / 4
          WHEN rating_type = 'scale' THEN (rating_value - 1)::numeric / 9
          ELSE 0
        END
      ) as avg_rating
    FROM feedback_entries f
    WHERE 
      (filter_user_id IS NULL OR f.user_id = filter_user_id)
      AND (filter_project_id IS NULL OR f.project_id = filter_project_id)
      AND (filter_provider IS NULL OR f.ai_provider = filter_provider)
      AND f.created_at >= now() - interval '1 day' * days_back
    GROUP BY ai_provider
  ) provider_data;

  -- Build final result
  result := jsonb_build_object(
    'total_feedback', total_feedback,
    'average_rating', COALESCE(average_rating, 0),
    'rating_distribution', COALESCE(rating_distribution, '{}'::jsonb),
    'provider_stats', COALESCE(provider_stats, '{}'::jsonb),
    'period_days', days_back,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- Feedback trends analysis function
CREATE OR REPLACE FUNCTION get_feedback_trends(
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL,
  days_back int DEFAULT 30,
  interval_days int DEFAULT 1
)
RETURNS TABLE (
  date date,
  feedback_count bigint,
  average_rating numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(f.created_at) as date,
    COUNT(*) as feedback_count,
    AVG(
      CASE 
        WHEN f.rating_type = 'thumbs' THEN f.rating_value::numeric
        WHEN f.rating_type = 'stars' THEN (f.rating_value - 1)::numeric / 4
        WHEN f.rating_type = 'scale' THEN (f.rating_value - 1)::numeric / 9
        ELSE 0
      END
    ) as average_rating
  FROM feedback_entries f
  WHERE 
    (filter_user_id IS NULL OR f.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR f.project_id = filter_project_id)
    AND f.created_at >= now() - interval '1 day' * days_back
  GROUP BY DATE(f.created_at)
  ORDER BY date DESC;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON feedback_entries TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_trends TO authenticated;