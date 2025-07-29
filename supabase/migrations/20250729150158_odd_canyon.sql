@@ .. @@
 ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

+-- Create trigger function to automatically update updated_at timestamp
+CREATE OR REPLACE FUNCTION update_projects_updated_at()
+RETURNS TRIGGER AS $$
+BEGIN
+  NEW.updated_at = now();
+  RETURN NEW;
+END;
+$$ language 'plpgsql';
+
+-- Create trigger to automatically update updated_at on row updates
+CREATE TRIGGER set_updated_at_on_projects
+  BEFORE UPDATE ON projects
+  FOR EACH ROW
+  EXECUTE FUNCTION update_projects_updated_at();
+
 -- RLS Policies for projects table