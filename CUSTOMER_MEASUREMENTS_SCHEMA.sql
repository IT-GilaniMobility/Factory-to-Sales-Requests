-- ============================================================
-- Customer Vehicle Measurements Form - Lightweight Schema
-- For collecting customer name and vehicle measurements only
-- ============================================================

-- Create table for customer measurements
CREATE TABLE IF NOT EXISTS customer_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurements_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT, -- Email of the customer who filled the form
  
  -- Vehicle Information
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  
  -- Vehicle Measurements (mm)
  measure_a NUMERIC,
  measure_b NUMERIC,
  measure_c NUMERIC,
  measure_d NUMERIC,
  measure_h NUMERIC,
  floor_to_ground NUMERIC,
  
  -- Status flags
  is_submitted BOOLEAN DEFAULT FALSE,
  
  -- Link to request (if exists) - can be filled later
  linked_request_id UUID,
  linked_request_table TEXT, -- 'requests', 'g24_requests', etc.
  
  -- Full data as JSON
  payload JSONB
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_measurements_token ON customer_measurements(measurements_token);
CREATE INDEX IF NOT EXISTS idx_measurements_created_at ON customer_measurements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_is_submitted ON customer_measurements(is_submitted);
CREATE INDEX IF NOT EXISTS idx_measurements_linked_request ON customer_measurements(linked_request_id);
CREATE INDEX IF NOT EXISTS idx_measurements_customer_email ON customer_measurements(customer_email);

-- Add column to existing request tables to link to customer measurements
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS customer_measurements_id UUID REFERENCES customer_measurements(id);

ALTER TABLE g24_requests
ADD COLUMN IF NOT EXISTS customer_measurements_id UUID REFERENCES customer_measurements(id);

ALTER TABLE diving_solution_requests
ADD COLUMN IF NOT EXISTS customer_measurements_id UUID REFERENCES customer_measurements(id);

ALTER TABLE turney_seat_requests
ADD COLUMN IF NOT EXISTS customer_measurements_id UUID REFERENCES customer_measurements(id);

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_requests_measurements_id ON requests(customer_measurements_id);
CREATE INDEX IF NOT EXISTS idx_g24_measurements_id ON g24_requests(customer_measurements_id);
CREATE INDEX IF NOT EXISTS idx_diving_measurements_id ON diving_solution_requests(customer_measurements_id);
CREATE INDEX IF NOT EXISTS idx_turney_measurements_id ON turney_seat_requests(customer_measurements_id);

-- ALTER existing customer_measurements table if it already exists to add customer_email column
ALTER TABLE customer_measurements
ADD COLUMN IF NOT EXISTS customer_email TEXT;
