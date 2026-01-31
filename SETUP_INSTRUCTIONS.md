# Database Setup Guide for Workrequest Demo

## Overview
The application now uses three separate tables in Supabase to store different types of work requests:

1. **requests** - Wheelchair Lifter Installation requests
2. **g24_requests** - Ultimate G24 Installation requests  
3. **diving_solution_requests** - Diving Solution Installation requests

## Database Schema

### Step 1: Create the Tables

Run the following SQL in your Supabase SQL Editor:

```sql
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

-- Create indexes for searching
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

-- Create indexes for searching
CREATE INDEX IF NOT EXISTS idx_diving_request_code ON diving_solution_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_diving_customer_mobile ON diving_solution_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_diving_quote_ref ON diving_solution_requests(quote_ref);
CREATE INDEX IF NOT EXISTS idx_diving_created_at ON diving_solution_requests(created_at DESC);
```

## Step 2: Configure Row-Level Security (RLS)

Run these commands in Supabase SQL to enable RLS with anonymous user policies:

```sql
-- Enable RLS on all tables
ALTER TABLE g24_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diving_solution_requests ENABLE ROW LEVEL SECURITY;

-- G24 Requests Policies
CREATE POLICY "allow_anonymous_insert_g24" ON g24_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_anonymous_select_g24" ON g24_requests
  FOR SELECT
  USING (true);

CREATE POLICY "allow_anonymous_update_g24" ON g24_requests
  FOR UPDATE
  USING (true);

-- Diving Solution Requests Policies
CREATE POLICY "allow_anonymous_insert_diving" ON diving_solution_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_anonymous_select_diving" ON diving_solution_requests
  FOR SELECT
  USING (true);

CREATE POLICY "allow_anonymous_update_diving" ON diving_solution_requests
  FOR UPDATE
  USING (true);
```

## Step 3: Verify in Application

The application will now:

1. **On Form Submission**: Route requests to the appropriate table based on job type:
   - "Wheelchair Lifter Installation" → `requests` table
   - "The Ultimate G24" → `g24_requests` table
   - "Diving Solution Installation" → `diving_solution_requests` table

2. **On Dashboard Load**: Load requests from all three tables and merge them

3. **Display Different Previews**:
   - **Wheelchair Lifter**: Shows Vehicle, User Weight, Wheelchair Type
   - **Ultimate G24**: Shows Vehicle, Product Model, Seat Position, Tie Down Type
   - **Diving Solution**: Shows Vehicle, Device Model, Installation Location, Driver Seat Position

## Key Changes Made

### Customer.jsx
- Updated `handleSubmit()` to insert into different tables based on `formData.jobRequest`
- Added validation for Diving Solution fields
- Added `divingSolution` object to payload

### RequestJobs.jsx
- Updated `loadFromSupabase()` to fetch from all three tables simultaneously
- Added `renderPreviewDetails()` helper function to show type-specific information
- Updated both grid and list view to display different preview details
- Added `jobRequest` field mapping for all request types

## Data Structure

Each request stores:
- Customer information (name, mobile, address, quote reference)
- Vehicle details (make, model, year)
- Type-specific information (measurements, device specs, etc.)
- Complete `payload` as JSONB for flexibility and future queries
- Status, timestamps, and unique request code

## Support

If you need to query the data, use:

```sql
-- Get all requests across types
SELECT request_code, status, customer_name, created_at FROM requests
UNION ALL
SELECT request_code, status, customer_name, created_at FROM g24_requests
UNION ALL
SELECT request_code, status, customer_name, created_at FROM diving_solution_requests
ORDER BY created_at DESC;

-- Get specific type
SELECT * FROM g24_requests WHERE status = 'Requested to factory';
SELECT * FROM diving_solution_requests WHERE created_at > NOW() - INTERVAL '30 days';
```
