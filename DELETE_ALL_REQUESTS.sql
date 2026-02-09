-- DELETE ALL REQUESTS FROM SYSTEM
-- WARNING: This will permanently delete all job cards and related data
-- Run this in Supabase SQL Editor

-- Delete all related data first (to avoid foreign key constraints)

-- 1. Delete all work hours logs
DELETE FROM work_hours_log;

-- 2. Delete all QC inspections
DELETE FROM qc_inspections;

-- 3. Delete all delivery notes
DELETE FROM delivery_notes;

-- 4. Delete all requests from all tables
DELETE FROM requests;
DELETE FROM g24_requests;
DELETE FROM diving_solution_requests;
DELETE FROM turney_seat_requests;

-- Optional: Delete all files from storage bucket
-- Note: Storage files need to be deleted from Supabase Storage UI or via API
-- You can do this manually in: Storage > request-attachments > Delete all files

-- Verify deletion
SELECT 'Wheelchair Requests' as table_name, COUNT(*) as remaining FROM requests
UNION ALL
SELECT 'G24 Requests', COUNT(*) FROM g24_requests
UNION ALL
SELECT 'Diving Solution Requests', COUNT(*) FROM diving_solution_requests
UNION ALL
SELECT 'Turney Seat Requests', COUNT(*) FROM turney_seat_requests
UNION ALL
SELECT 'Work Hours', COUNT(*) FROM work_hours_log
UNION ALL
SELECT 'QC Inspections', COUNT(*) FROM qc_inspections
UNION ALL
SELECT 'Delivery Notes', COUNT(*) FROM delivery_notes;

-- All counts should show 0
