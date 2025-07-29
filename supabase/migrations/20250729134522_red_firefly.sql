/*
  # Create API keys table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `provider` (text, AI provider name)
      - `encrypted_key` (text, encrypted API key)
      - `key_preview` (text, last 4 characters for display)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policies for users to manage their own API keys
    - Add trigger for automatic updated_at timestamp updates

  3. Constraints
    - Check constraint for valid provider values
    - Indexes for efficient queries
*/

-- Create api_keys table with proper auth.users reference
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider = ANY (ARRAY['OpenAI'::text, 'Claude'::text, 'DeepSeek'::text, 'Grok'::text, 'Mistral'::text])),
  encrypted_key text NOT NULL,
  key_preview text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE api_keys IS 'Encrypted API keys for various AI providers';
COMMENT ON COLUMN api_keys.id IS 'Unique identifier for the API key';
COMMENT ON COLUMN api_keys.user_id IS 'Foreign key reference to auth.users(id)';
COMMENT ON COLUMN api_keys.provider IS 'AI provider name (OpenAI, Claude, DeepSeek, Grok, Mistral)';
COMMENT ON COLUMN api_keys.encrypted_key IS 'Encrypted API key for secure storage';
COMMENT ON COLUMN api_keys.key_preview IS 'Last 4 characters of API key for display purposes';
COMMENT ON COLUMN api_keys.created_at IS 'API key creation timestamp';
COMMENT ON COLUMN api_keys.updated_at IS 'Last modification timestamp';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();