-- SQL for creating tables for Ultimate G24, Diving Solutions, and Turney Seat Installation
-- Run these queries in your Supabase SQL Editor

-- ============================================================================
-- TABLE: g24_requests
-- For Ultimate G24 Installation requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS g24_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Requested to factory',
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quote_ref TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  
  -- Product Selection
  product_model TEXT,
  product_model_other TEXT,
  
  -- Second Row Seat Position
  second_row_seat TEXT,
  second_row_seat_other TEXT,
  
  -- Tie Down Type
  tie_down TEXT,
  tie_down_other TEXT,
  
  -- Floor Add-ons
  floor_add_on TEXT,
  floor_add_on_other TEXT,
  
  -- Full payload as JSON for flexibility
  payload JSONB NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_g24_request_code ON g24_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_g24_customer_mobile ON g24_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_g24_quote_ref ON g24_requests(quote_ref);
CREATE INDEX IF NOT EXISTS idx_g24_created_at ON g24_requests(created_at DESC);

-- ============================================================================
-- TABLE: diving_solution_requests
-- For Diving Solution Installation requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS diving_solution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Requested to factory',
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quote_ref TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  
  -- Installation Specifications
  device_model TEXT NOT NULL,
  installation_location TEXT,
  driver_seat_position TEXT,
  steering_wheel_position TEXT,
  
  -- Full payload as JSON for flexibility
  payload JSONB NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_diving_request_code ON diving_solution_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_diving_customer_mobile ON diving_solution_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_diving_quote_ref ON diving_solution_requests(quote_ref);

-- ============================================================================
-- TABLE: turney_seat_requests
-- For Turney Seat Installation requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS turney_seat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Requested to factory',
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quote_ref TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  
  -- User Information
  user_weight FLOAT,
  user_height_1 FLOAT,
  user_height_2 FLOAT,
  user_situation TEXT,
  
  -- Vehicle Measurements (Misure)
  misua_a FLOAT,
  misua_b FLOAT,
  misua_c FLOAT,
  misua_d FLOAT,
  misua_e FLOAT,
  seat_base_measurement FLOAT,
  seat_bracket_measurement FLOAT,
  
  -- Product Configuration
  product_model TEXT,
  special_request TEXT,
  optional_extra_add_ons TEXT,
  product_location TEXT,
  
  -- Full payload as JSON for flexibility
  payload JSONB NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_turney_request_code ON turney_seat_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_turney_customer_mobile ON turney_seat_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_turney_quote_ref ON turney_seat_requests(quote_ref);
CREATE INDEX IF NOT EXISTS idx_turney_created_at ON turney_seat_requests(created_at DESC);

-- ============================================================================
-- TABLE: wheelchair_lifter_requests (keep existing structure)
-- For Wheelchair Lifter Installation requests
-- ============================================================================
-- This already exists, but here's the expected structure for reference:
-- 
-- CREATE TABLE IF NOT EXISTS requests (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   request_code VARCHAR(50) UNIQUE NOT NULL,
--   status VARCHAR(100) DEFAULT 'Requested to factory',
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   customer_name VARCHAR(255),
--   customer_mobile VARCHAR(20),
--   customer_address TEXT,
--   quote_ref VARCHAR(255),
--   request_type VARCHAR(100),
--   vehicle_make VARCHAR(100),
--   vehicle_model VARCHAR(100),
--   vehicle_year INTEGER,
--   measure_a FLOAT,
--   measure_b FLOAT,
--   measure_c FLOAT,
--   measure_d FLOAT,
--   measure_h FLOAT,
--   floor_to_ground FLOAT,
--   payload JSONB,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
