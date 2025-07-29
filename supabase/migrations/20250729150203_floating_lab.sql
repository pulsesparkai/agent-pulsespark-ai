@@ .. @@
 ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

+-- Create trigger function to automatically update updated_at timestamp
+CREATE OR REPLACE FUNCTION update_memory_updated_at()
+RETURNS TRIGGER AS $$
+BEGIN
+  NEW.updated_at = now();
+  RETURN NEW;
+END;
+$$ language 'plpgsql';
+
+-- Create trigger to automatically update updated_at on row updates
+CREATE TRIGGER update_memory_items_updated_at
+  BEFORE UPDATE ON memory_items
+  FOR EACH ROW
+  EXECUTE FUNCTION update_memory_updated_at();
+
 -- Create indexes for better query performance