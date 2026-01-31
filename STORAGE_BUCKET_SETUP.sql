-- ============================================================================
-- SUPABASE STORAGE BUCKET SETUP FOR REQUEST ATTACHMENTS AND PDFS
-- ============================================================================
-- This script creates the storage buckets for:
-- 1. request-pdfs - For generated PDF forms (PRIVATE)
-- 2. request-attachments - For user uploaded files (PUBLIC)
-- 3. vehicle-photos - For customer uploaded photos (PUBLIC)
-- 
-- IMPORTANT: Buckets cannot be created via SQL in Supabase Dashboard
-- You MUST manually create the buckets via the Supabase UI first:
--
-- Steps:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create a new bucket" (THREE TIMES for each bucket below)
-- 3. Then run the policies below in SQL editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKETS (Manual via UI - CREATE ALL 3 BUCKETS)
-- ============================================================================

-- BUCKET 1: request-pdfs (PRIVATE)
-- Name: request-pdfs
-- Private: YES (check "Private bucket")
-- Purpose: Store generated PDF forms

-- BUCKET 2: request-attachments (PUBLIC)
-- Name: request-attachments
-- Private: NO (uncheck "Private bucket")
-- Purpose: Store user uploaded files (PDFs, docs, images)

-- BUCKET 3: vehicle-photos (PUBLIC)
-- Name: vehicle-photos
-- Private: NO (uncheck "Private bucket")
-- Purpose: Store customer uploaded vehicle photos

-- ============================================================================
-- STEP 2: SET STORAGE POLICIES (Run in SQL Editor after buckets are created)
-- ============================================================================

-- ========================================
-- POLICIES FOR: request-pdfs (PRIVATE)
-- ========================================

-- Policy 1: Allow authenticated users to upload PDFs
DROP POLICY IF EXISTS "Allow authenticated upload request-pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated upload request-pdfs" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'request-pdfs' AND 
    auth.role() = 'authenticated'
  );

-- Policy 2: Allow authenticated users to read PDFs
DROP POLICY IF EXISTS "Allow authenticated read request-pdfs" ON storage.objects;
CREATE POLICY "Allow authenticated read request-pdfs" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'request-pdfs' AND 
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow public read (for customer form links)
DROP POLICY IF EXISTS "Allow public read request-pdfs" ON storage.objects;
CREATE POLICY "Allow public read request-pdfs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'request-pdfs');

-- ========================================
-- POLICIES FOR: request-attachments (PUBLIC)
-- ========================================
DROP POLICY IF EXISTS "Allow public read request-attachments" ON storage.objects;
CREATE POLICY "Allow public read request-attachments" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'request-attachments');

-- Policy 2: Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated upload request-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated upload request-attachments" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to delete files
DROP POLICY IF EXISTS "Allow authenticated delete request-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated delete request-attachments" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );

-- Policy 4: Allow authenticated users to update file metadata
DROP POLICY IF EXISTS "Allow authenticated update request-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated update request-attachments" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );

-- ============================================================================
-- STEP 3: VERIFY BUCKET EXISTS (Run this query to check)
-- ============================================================================
-- SELECT 
--   name, 
--   id, 
--   public,
--   created_at
-- FROM storage.buckets 
-- WHERE name = 'request-attachments';

-- Expected output:
-- name                    | id                  | public | created_at
-- request-attachments     | <bucket-id-uuid>    | true   | <timestamp>

-- ============================================================================
-- STEP 4: LIST ALL FILES IN BUCKET (Optional - for verification)
-- ============================================================================
-- SELECT 
--   name, 
--   owner,
--   created_at,
--   updated_at,
--   metadata
-- FROM storage.objects 
-- WHERE bucket_id = 'request-attachments'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- ============================================================================
-- STEP 5: DELETE TEST FILES (Optional - for cleanup)
-- ============================================================================
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'request-attachments' 
-- AND name LIKE 'test%';

-- ============================================================================
-- STEP 6: TEST THE SETUP
-- ============================================================================
-- After creating the bucket and policies, test file upload in the app:
-- 1. Open job request form
-- 2. Click "Upload Files (PDF, Images, Documents)"
-- 3. Select a file and try to upload
-- 4. If successful, file will appear in the attachment list
-- 5. If fails with "Bucket not found", the bucket wasn't created properly

-- ============================================================================
-- QUICK SETUP CHECKLIST
-- ============================================================================
-- [ ] 1. Create "request-attachments" bucket in Supabase Storage UI (PUBLIC)
-- [ ] 2. Run all 4 CREATE POLICY statements in SQL editor
-- [ ] 3. Verify bucket exists with the SELECT query
-- [ ] 4. Test file upload in the application
-- [ ] 5. Verify file appears in RequestDetails page
-- [ ] 6. Test file deletion (Remove button)

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- Issue: "Bucket not found" error
-- Solution: Create the bucket via Supabase Dashboard → Storage (step 1)
--
-- Issue: "Permission denied" on upload
-- Solution: Run the CREATE POLICY statements above in SQL editor
--
-- Issue: File uploads but can't be viewed
-- Solution: Make sure bucket is set to PUBLIC (not private)
--
-- Issue: Can't delete files
-- Solution: Verify DELETE policy is created correctly

-- ============================================================================
-- BUCKET STRUCTURE
-- ============================================================================
-- Files are organized as:
-- request-attachments/
-- ├── DRAFT-{timestamp}_{timestamp}.pdf
-- ├── DRAFT-{timestamp}_{timestamp}.docx
-- ├── DRAFT-{timestamp}_{timestamp}.jpg
-- └── (more files...)

-- Files are publicly accessible at:
-- https://<project-id>.supabase.co/storage/v1/object/public/request-attachments/<filename>
