-- Migration: Add start_time and end_time to work_hours_log table
-- Run this SQL in Supabase SQL Editor if the table already exists

-- Add start_time column (optional)
ALTER TABLE work_hours_log 
ADD COLUMN IF NOT EXISTS start_time TIME;

-- Add end_time column (optional)
ALTER TABLE work_hours_log 
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add comment for documentation
COMMENT ON COLUMN work_hours_log.start_time IS 'Start time of work session (e.g., 09:00:00)';
COMMENT ON COLUMN work_hours_log.end_time IS 'End time of work session (e.g., 17:30:00)';

-- Verification query to check the new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'work_hours_log' 
ORDER BY ordinal_position;
