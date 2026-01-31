-- ============================================================================
-- ADD request_attachments COLUMN TO ALL 4 REQUEST TABLES
-- ============================================================================
-- This migration adds the request_attachments column to store file metadata
-- for uploaded files (PDFs, images, documents, etc.)
-- ============================================================================

-- Table 1: requests (Wheelchair Lifter Installation)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS request_attachments JSONB DEFAULT '[]'::jsonb;

-- Table 2: g24_requests (The Ultimate G24)
ALTER TABLE g24_requests 
ADD COLUMN IF NOT EXISTS request_attachments JSONB DEFAULT '[]'::jsonb;

-- Table 3: diving_solution_requests (Diving Solution Installation)
ALTER TABLE diving_solution_requests 
ADD COLUMN IF NOT EXISTS request_attachments JSONB DEFAULT '[]'::jsonb;

-- Table 4: turney_seat_requests (Turney Seat Installation)
ALTER TABLE turney_seat_requests 
ADD COLUMN IF NOT EXISTS request_attachments JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- VERIFY COLUMNS WERE ADDED
-- ============================================================================
-- Run this query to verify the columns exist:
/*
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE column_name = 'request_attachments'
  AND table_name IN ('requests', 'g24_requests', 'diving_solution_requests', 'turney_seat_requests')
ORDER BY table_name;

Expected output:
table_name                  | column_name          | data_type | column_default
requests                    | request_attachments  | jsonb     | '[]'::jsonb
g24_requests                | request_attachments  | jsonb     | '[]'::jsonb
diving_solution_requests    | request_attachments  | jsonb     | '[]'::jsonb
turney_seat_requests        | request_attachments  | jsonb     | '[]'::jsonb
*/

-- ============================================================================
-- STRUCTURE OF request_attachments JSONB COLUMN
-- ============================================================================
-- Each attachment object in the array has this structure:
/*
{
  "id": "unique-file-id",
  "name": "filename.pdf",
  "url": "https://..../request-attachments/filename.pdf",
  "size": 1024,
  "type": "application/pdf",
  "uploadedAt": "2026-01-14T10:30:00Z",
  "uploadedBy": "user@email.com"
}
*/

-- Example JSONB value:
/*
[
  {
    "id": "file-1",
    "name": "quote.pdf",
    "url": "https://hspkjwqgzbswdnjvvwqj.supabase.co/storage/v1/object/public/request-attachments/DRAFT-1705232400000_quote.pdf",
    "size": 256000,
    "type": "application/pdf",
    "uploadedAt": "2026-01-14T10:30:00Z",
    "uploadedBy": "eng@gilanimobility.ae"
  },
  {
    "id": "file-2",
    "name": "measurements.jpg",
    "url": "https://hspkjwqgzbswdnjvvwqj.supabase.co/storage/v1/object/public/request-attachments/DRAFT-1705232400000_measurements.jpg",
    "size": 512000,
    "type": "image/jpeg",
    "uploadedAt": "2026-01-14T10:31:00Z",
    "uploadedBy": "eng@gilanimobility.ae"
  }
]
*/

-- ============================================================================
-- STEPS TO APPLY THIS MIGRATION
-- ============================================================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Create a new query
-- 3. Copy the entire ALTER TABLE statements above (lines 8-21)
-- 4. Click "Run" button
-- 5. Wait for success message
-- 6. Run the verification query to confirm columns were added
-- 7. Refresh the app and try submitting a request again

-- ============================================================================
-- AFTER MIGRATION
-- ============================================================================
-- - The form will now accept file attachments
-- - Files will be uploaded to request-attachments bucket
-- - File metadata will be stored in the request_attachments JSONB column
-- - Users can view, download, and remove attachments
-- - Attachments are optional (defaults to empty array [])
