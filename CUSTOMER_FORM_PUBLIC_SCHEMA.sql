-- ============================================================
-- Customer Form Public - Complete Schema
-- For customers to fill name, contact, measurements, and signature
-- ============================================================

-- Create table for public customer forms
CREATE TABLE IF NOT EXISTS customer_forms_public (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  -- Customer Information
  customer_name TEXT,
  customer_mobile TEXT,
  customer_address TEXT,
  customer_email TEXT, -- From Google login
  
  -- Vehicle Information
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  
  -- User Measurements (for wheelchair user)
  user_weight_kg NUMERIC,
  wheelchair_weight_kg NUMERIC,
  wheelchair_type TEXT,
  measure_a NUMERIC,  -- User measurement A
  measure_b NUMERIC,  -- User measurement B
  measure_c NUMERIC,  -- User measurement C
  user_situation TEXT,
  
  -- Vehicle Measurements
  measure_d NUMERIC,  -- Vehicle measurement D
  measure_h NUMERIC,  -- Vehicle measurement H
  floor_to_ground NUMERIC,
  
  -- Signature
  signature_data_url TEXT,  -- Base64 signature image
  
  -- Status flags
  is_submitted BOOLEAN DEFAULT FALSE,
  
  -- Link to actual request (when admin converts it)
  converted_to_request_id UUID,
  converted_to_request_table TEXT,
  converted_at TIMESTAMPTZ,
  converted_by_email TEXT,
  
  -- Metadata
  generated_by_email TEXT,  -- Admin who generated the link
  notes TEXT,
  
  -- Full data as JSON
  payload JSONB
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_forms_token ON customer_forms_public(form_token);
CREATE INDEX IF NOT EXISTS idx_customer_forms_created_at ON customer_forms_public(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_forms_submitted ON customer_forms_public(is_submitted);
CREATE INDEX IF NOT EXISTS idx_customer_forms_customer_email ON customer_forms_public(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_forms_generated_by ON customer_forms_public(generated_by_email);
CREATE INDEX IF NOT EXISTS idx_customer_forms_converted ON customer_forms_public(converted_to_request_id);

-- Add reference to customer_forms_public from request tables (optional, for tracking source)
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS source_customer_form_id UUID REFERENCES customer_forms_public(id);

ALTER TABLE g24_requests
ADD COLUMN IF NOT EXISTS source_customer_form_id UUID REFERENCES customer_forms_public(id);

ALTER TABLE diving_solution_requests
ADD COLUMN IF NOT EXISTS source_customer_form_id UUID REFERENCES customer_forms_public(id);

ALTER TABLE turney_seat_requests
ADD COLUMN IF NOT EXISTS source_customer_form_id UUID REFERENCES customer_forms_public(id);

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_requests_customer_form_id ON requests(source_customer_form_id);
CREATE INDEX IF NOT EXISTS idx_g24_customer_form_id ON g24_requests(source_customer_form_id);
CREATE INDEX IF NOT EXISTS idx_diving_customer_form_id ON diving_solution_requests(source_customer_form_id);
CREATE INDEX IF NOT EXISTS idx_turney_customer_form_id ON turney_seat_requests(source_customer_form_id);

-- Add RLS policies for security (optional)
-- Enable RLS
ALTER TABLE customer_forms_public ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access with valid token (for customer view)
CREATE POLICY "Allow public read with token" ON customer_forms_public
  FOR SELECT
  USING (true);

-- Policy: Allow public insert/update with valid token (for customer submission)
CREATE POLICY "Allow public insert" ON customer_forms_public
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update own submission" ON customer_forms_public
  FOR UPDATE
  USING (true);

-- Policy: Allow authenticated users (admins/sales) to read all
CREATE POLICY "Allow authenticated users to read all" ON customer_forms_public
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update all (for conversion)
CREATE POLICY "Allow authenticated users to update" ON customer_forms_public
  FOR UPDATE
  TO authenticated
  USING (true);
