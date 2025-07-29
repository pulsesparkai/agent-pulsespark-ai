/*
  # Create chat sessions table

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, chat session title)
      - `messages` (jsonb, array of chat messages)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `chat_sessions` table
    - Add policy for users to manage their own chat sessions

  3. Indexes
    - Index on user_id for efficient user session queries
    - Index on updated_at for sorting by recent activity
*/

-- Create chat_sessions table with proper auth.users reference
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Chat',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE chat_sessions IS 'Chat sessions with message history for users';
COMMENT ON COLUMN chat_sessions.id IS 'Unique identifier for the chat session';
COMMENT ON COLUMN chat_sessions.user_id IS 'Foreign key reference to auth.users(id)';
COMMENT ON COLUMN chat_sessions.title IS 'User-defined title for the chat session';
COMMENT ON COLUMN chat_sessions.messages IS 'JSON array of chat messages';
COMMENT ON COLUMN chat_sessions.created_at IS 'Chat session creation timestamp';
COMMENT ON COLUMN chat_sessions.updated_at IS 'Last message timestamp';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for chat_sessions
CREATE POLICY "Users can manage their own chat sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);