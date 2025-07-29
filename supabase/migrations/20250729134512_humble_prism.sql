/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `description` (text, optional)
      - `file_tree` (jsonb, stores project file structure)
      - `github_repo` (text, optional)
      - `github_branch` (text, default 'main')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `projects` table
    - Add policy for users to manage their own projects
    - Add trigger for automatic updated_at timestamp updates

  3. Indexes
    - Index on user_id for efficient user project queries
    - Index on updated_at for sorting by modification time
*/

-- Create projects table with proper auth.users reference
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  file_tree jsonb NOT NULL DEFAULT '{}'::jsonb,
  github_repo text,
  github_branch text DEFAULT 'main',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE projects IS 'User projects with file structures and GitHub integration';
COMMENT ON COLUMN projects.id IS 'Unique identifier for the project';
COMMENT ON COLUMN projects.user_id IS 'Foreign key reference to auth.users(id)';
COMMENT ON COLUMN projects.name IS 'Project name';
COMMENT ON COLUMN projects.description IS 'Optional project description';
COMMENT ON COLUMN projects.file_tree IS 'JSON structure representing project files and folders';
COMMENT ON COLUMN projects.github_repo IS 'Optional GitHub repository URL';
COMMENT ON COLUMN projects.github_branch IS 'GitHub branch name (default: main)';
COMMENT ON COLUMN projects.created_at IS 'Project creation timestamp';
COMMENT ON COLUMN projects.updated_at IS 'Last modification timestamp';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can manage their own projects"
  ON projects
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER set_updated_at_on_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();