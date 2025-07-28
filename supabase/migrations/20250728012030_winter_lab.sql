/*
  # Feedback Loop System for PulseSpark

  1. New Tables
    - `feedback_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `chat_session_id` (uuid, foreign key to chat_sessions, nullable)
      - `ai_response_id` (text, reference to specific AI response)
      - `ai_provider` (text, which AI provider generated the response)
      - `rating_type` (text, type of rating: thumbs, stars, scale)
      - `rating_value` (integer, the actual rating value)
      - `feedback_text` (text, optional user comments)
      - `response_context` (jsonb, context about the AI response)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `feedback_entries` table
    - Add policies for users to manage their own feedback
    - Add indexes for efficient querying

  3. Functions
    - Aggregate feedback statistics
    - Get feedback trends over time
*/

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create feedback_entries table
CREATE TABLE IF NOT EXISTS feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  chat_session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  ai_response_id text NOT NULL,
  ai_provider text NOT NULL CHECK (ai_provider IN ('OpenAI', 'Claude', 'DeepSeek', 'Grok', 'Mistral')),
  rating_type text NOT NULL CHECK (rating_type IN ('thumbs', 'stars', 'scale')),
  rating_value integer NOT NULL,
  feedback_text text,
  response_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback_entries
CREATE POLICY "Users can manage their own feedback"
  ON feedback_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_provider ON feedback_entries(ai_provider);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback_entries(rating_type, rating_value);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_entries(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_entries_updated_at
  BEFORE UPDATE ON feedback_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats(
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL,
  filter_provider text DEFAULT NULL,
  days_back integer DEFAULT 30
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_feedback integer;
  avg_rating numeric;
  rating_distribution jsonb;
  provider_stats jsonb;
BEGIN
  -- Build base query conditions
  WITH filtered_feedback AS (
    SELECT *
    FROM feedback_entries
    WHERE 
      (filter_user_id IS NULL OR user_id = filter_user_id)
      AND (filter_project_id IS NULL OR project_id = filter_project_id)
      AND (filter_provider IS NULL OR ai_provider = filter_provider)
      AND created_at >= now() - interval '1 day' * days_back
  ),
  
  -- Calculate total feedback count
  total_count AS (
    SELECT count(*) as total
    FROM filtered_feedback
  ),
  
  -- Calculate average rating (normalized to 0-1 scale)
  avg_rating_calc AS (
    SELECT 
      CASE 
        WHEN rating_type = 'thumbs' THEN avg(CASE WHEN rating_value = 1 THEN 1.0 ELSE 0.0 END)
        WHEN rating_type = 'stars' THEN avg(rating_value::numeric / 5.0)
        WHEN rating_type = 'scale' THEN avg(rating_value::numeric / 10.0)
        ELSE 0.5
      END as avg_norm_rating
    FROM filtered_feedback
  ),
  
  -- Calculate rating distribution
  rating_dist AS (
    SELECT 
      jsonb_object_agg(
        rating_value::text, 
        count(*)
      ) as distribution
    FROM filtered_feedback
    GROUP BY rating_type
  ),
  
  -- Calculate provider statistics
  provider_stats_calc AS (
    SELECT 
      jsonb_object_agg(
        ai_provider,
        jsonb_build_object(
          'count', count(*),
          'avg_rating', avg(
            CASE 
              WHEN rating_type = 'thumbs' THEN CASE WHEN rating_value = 1 THEN 1.0 ELSE 0.0 END
              WHEN rating_type = 'stars' THEN rating_value::numeric / 5.0
              WHEN rating_type = 'scale' THEN rating_value::numeric / 10.0
              ELSE 0.5
            END
          )
        )
      ) as stats
    FROM filtered_feedback
    GROUP BY ai_provider
  )
  
  SELECT 
    jsonb_build_object(
      'total_feedback', COALESCE(tc.total, 0),
      'average_rating', COALESCE(arc.avg_norm_rating, 0),
      'rating_distribution', COALESCE(rd.distribution, '{}'::jsonb),
      'provider_stats', COALESCE(psc.stats, '{}'::jsonb),
      'period_days', days_back,
      'generated_at', now()
    )
  INTO result
  FROM total_count tc
  CROSS JOIN avg_rating_calc arc
  CROSS JOIN rating_dist rd
  CROSS JOIN provider_stats_calc psc;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feedback trends over time
CREATE OR REPLACE FUNCTION get_feedback_trends(
  filter_user_id uuid DEFAULT NULL,
  filter_project_id uuid DEFAULT NULL,
  days_back integer DEFAULT 30,
  interval_days integer DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  WITH date_series AS (
    SELECT 
      generate_series(
        date_trunc('day', now() - interval '1 day' * days_back),
        date_trunc('day', now()),
        interval '1 day' * interval_days
      )::date as date_bucket
  ),
  
  feedback_by_date AS (
    SELECT 
      date_trunc('day', created_at)::date as feedback_date,
      count(*) as feedback_count,
      avg(
        CASE 
          WHEN rating_type = 'thumbs' THEN CASE WHEN rating_value = 1 THEN 1.0 ELSE 0.0 END
          WHEN rating_type = 'stars' THEN rating_value::numeric / 5.0
          WHEN rating_type = 'scale' THEN rating_value::numeric / 10.0
          ELSE 0.5
        END
      ) as avg_rating
    FROM feedback_entries
    WHERE 
      (filter_user_id IS NULL OR user_id = filter_user_id)
      AND (filter_project_id IS NULL OR project_id = filter_project_id)
      AND created_at >= now() - interval '1 day' * days_back
    GROUP BY date_trunc('day', created_at)::date
  )
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.date_bucket,
      'feedback_count', COALESCE(fbd.feedback_count, 0),
      'average_rating', COALESCE(fbd.avg_rating, 0)
    )
    ORDER BY ds.date_bucket
  )
  INTO result
  FROM date_series ds
  LEFT JOIN feedback_by_date fbd ON ds.date_bucket = fbd.feedback_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;