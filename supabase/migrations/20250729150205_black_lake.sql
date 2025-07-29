@@ .. @@
 ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;

+-- Create trigger function to automatically update updated_at timestamp
+CREATE OR REPLACE FUNCTION update_feedback_updated_at()
+RETURNS TRIGGER AS $$
+BEGIN
+  NEW.updated_at = now();
+  RETURN NEW;
+END;
+$$ language 'plpgsql';
+
+-- Create trigger to automatically update updated_at on row updates
+CREATE TRIGGER update_feedback_entries_updated_at
+  BEFORE UPDATE ON feedback_entries
+  FOR EACH ROW
+  EXECUTE FUNCTION update_feedback_updated_at();
+
 -- Create indexes for better query performance