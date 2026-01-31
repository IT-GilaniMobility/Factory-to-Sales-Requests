-- ============================================
-- PDF & Customer Form Database Schema
-- Run these commands in Supabase SQL Editor
-- ============================================

-- 1. Add columns to 'requests' table (Wheelchair Lifter Installation)
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_form_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_vehicle_photos TEXT[],
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_filled_data JSONB;

-- 2. Add columns to 'g24_requests' table (The Ultimate G24)
ALTER TABLE g24_requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_form_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_vehicle_photos TEXT[],
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_filled_data JSONB;

-- 3. Add columns to 'diving_solution_requests' table (Diving Solution Installation)
ALTER TABLE diving_solution_requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_form_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_vehicle_photos TEXT[],
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_filled_data JSONB;

-- 4. Add columns to 'turney_seat_requests' table (Turney Seat Installation)
ALTER TABLE turney_seat_requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_form_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_vehicle_photos TEXT[],
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_filled_data JSONB;

-- 5. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_customer_token ON requests(customer_form_token);
CREATE INDEX IF NOT EXISTS idx_g24_customer_token ON g24_requests(customer_form_token);
CREATE INDEX IF NOT EXISTS idx_diving_customer_token ON diving_solution_requests(customer_form_token);
CREATE INDEX IF NOT EXISTS idx_turney_customer_token ON turney_seat_requests(customer_form_token);

-- ============================================
-- IMPORTANT: Create Storage Bucket in Supabase
-- ============================================
-- Go to Supabase Dashboard > Storage > Create Bucket
-- Bucket name: request-pdfs
-- Public: NO (keep private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf

-- Then create these storage policies:

-- Policy 1: Allow authenticated users to upload PDFs
CREATE POLICY "Allow authenticated users to upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-pdfs');

-- Policy 2: Allow authenticated users to read their own PDFs
CREATE POLICY "Allow authenticated users to read PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'request-pdfs');

-- Policy 3: Allow public read access for customer form tokens (signed URLs)
CREATE POLICY "Allow public read with signed URL"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'request-pdfs');

-- ============================================
-- Create Storage Bucket for Vehicle Photos
-- ============================================
-- Go to Supabase Dashboard > Storage > Create Bucket
-- Bucket name: vehicle-photos
-- Public: YES (customers need to upload without auth)
-- File size limit: 5MB per file
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policies for vehicle photos:

-- Policy 1: Allow anyone to upload vehicle photos
CREATE POLICY "Allow public upload of vehicle photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'vehicle-photos');

-- Policy 2: Allow anyone to read vehicle photos
CREATE POLICY "Allow public read of vehicle photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-photos');
