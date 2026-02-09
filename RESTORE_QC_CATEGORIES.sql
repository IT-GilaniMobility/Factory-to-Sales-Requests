-- Restore QC Categories Table
-- Run this in Supabase SQL Editor

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS qc_categories CASCADE;

-- Create the qc_categories table
CREATE TABLE qc_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all QC categories
INSERT INTO qc_categories (category_name) VALUES
  ('Vehicle Preparation'),
  ('Electrical Connections'),
  ('Mechanical Installation'),
  ('Safety Features'),
  ('Operational Testing'),
  ('Final Inspection'),
  ('Documentation'),
  ('Customer Handover');

-- Enable Row Level Security
ALTER TABLE qc_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow all authenticated users to read qc_categories"
  ON qc_categories FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow factory admins to insert/update/delete
CREATE POLICY "Allow factory admins to modify qc_categories"
  ON qc_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON qc_categories TO authenticated;
GRANT ALL ON qc_categories TO service_role;
GRANT USAGE, SELECT ON SEQUENCE qc_categories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE qc_categories_id_seq TO service_role;

-- Verify the data
SELECT * FROM qc_categories ORDER BY id;
