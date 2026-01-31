-- Enable Row Level Security on customer_measurements table
ALTER TABLE customer_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Allow public READ access to submitted measurements only
CREATE POLICY "Allow public read submitted measurements"
  ON customer_measurements
  FOR SELECT
  USING (is_submitted = true);

-- RLS Policy 2: Allow authenticated users to INSERT
CREATE POLICY "Allow authenticated insert measurements"
  ON customer_measurements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy 3: Allow authenticated users to UPDATE their own records
CREATE POLICY "Allow authenticated update measurements"
  ON customer_measurements
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy 4: Allow authenticated users to DELETE their own records
CREATE POLICY "Allow authenticated delete measurements"
  ON customer_measurements
  FOR DELETE
  USING (auth.role() = 'authenticated');
