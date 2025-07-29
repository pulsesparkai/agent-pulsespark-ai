@@ .. @@
 ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

+-- Create trigger function to automatically update updated_at timestamp
+CREATE OR REPLACE FUNCTION update_updated_at_column()
+RETURNS TRIGGER AS $$
+BEGIN
+  NEW.updated_at = now();
+  RETURN NEW;
+END;
+$$ language 'plpgsql';
+
+-- Create trigger to automatically update updated_at on row updates
+CREATE TRIGGER update_api_keys_updated_at
+  BEFORE UPDATE ON api_keys
+  FOR EACH ROW
+  EXECUTE FUNCTION update_updated_at_column();
+
 -- RLS Policies for api_keys table