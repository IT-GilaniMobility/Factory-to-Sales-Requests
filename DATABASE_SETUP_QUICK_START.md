# QUICK START - Run This in Supabase SQL Editor

## ⚠️ IMPORTANT: Run these commands in order

### Step 1: Copy everything below this line and paste into Supabase SQL Editor

```sql
-- ============================================
-- PDF & Customer Form Database Schema
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

-- 3. Add columns to 'diving_solution_requests' table
ALTER TABLE diving_solution_requests
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_form_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_vehicle_photos TEXT[],
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_filled_data JSONB;

-- 4. Add columns to 'turney_seat_requests' table
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
```

### Step 2: Create Storage Buckets in Supabase Dashboard

#### A. Create "request-pdfs" bucket (Private)
1. Go to: Supabase Dashboard → Storage → "New bucket"
2. Settings:
   - Name: `request-pdfs`
   - Public: ❌ **NO** (keep private)
   - File size limit: 10MB
   - Allowed types: application/pdf

#### B. Create "vehicle-photos" bucket (Public)
1. Go to: Supabase Dashboard → Storage → "New bucket"
2. Settings:
   - Name: `vehicle-photos`
   - Public: ✅ **YES**
   - File size limit: 5MB
   - Allowed types: image/jpeg, image/png, image/webp

### Step 3: Apply Storage Policies

Run this in SQL Editor after creating buckets:

```sql
-- Storage policies for request-pdfs bucket
CREATE POLICY "Allow authenticated users to upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-pdfs');

CREATE POLICY "Allow authenticated users to read PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'request-pdfs');

CREATE POLICY "Allow public read with signed URL"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'request-pdfs');

-- Storage policies for vehicle-photos bucket
CREATE POLICY "Allow public upload of vehicle photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow public read of vehicle photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-photos');
```

## ✅ That's it! Database is ready.

### What you just set up:
- ✅ Added PDF and customer submission columns to all 4 request tables
- ✅ Created indexes for fast token lookups
- ✅ Set up storage buckets for PDFs and photos
- ✅ Applied security policies

### Next steps:
1. Restart your dev server: `npm start`
2. Test the new features (see PDF_FEATURE_SETUP_GUIDE.md)
3. Generate a PDF from a form
4. Share the customer link
5. Have customer upload photos

### Test customer link format:
```
http://localhost:3000/customer-form/ABC123XYZ456
```

Where `ABC123XYZ456` is the auto-generated token.

## 🎉 All done!
