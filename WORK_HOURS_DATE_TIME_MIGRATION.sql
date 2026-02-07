-- Migration: Add start_date and end_date columns to work_hours_log table
-- This allows tracking work periods that span multiple days

-- First, drop any existing CHECK constraint on request_type that might be too restrictive
ALTER TABLE work_hours_log 
DROP CONSTRAINT IF EXISTS work_hours_log_request_check;

-- Recreate the constraint to allow 'general' and other valid request types
ALTER TABLE work_hours_log 
ADD CONSTRAINT work_hours_log_request_check 
CHECK (request_type IN ('wheelchair', 'g24', 'diving_solution', 'turney_seat', 'general'));

-- Add start_date column (defaults to work_date for existing records)
ALTER TABLE work_hours_log 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add end_date column (defaults to work_date for existing records)
ALTER TABLE work_hours_log 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update existing records to have start_date and end_date same as work_date
UPDATE work_hours_log 
SET start_date = work_date, 
    end_date = work_date 
WHERE start_date IS NULL OR end_date IS NULL;

-- Add NOT NULL constraints after populating existing records
ALTER TABLE work_hours_log 
ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE work_hours_log 
ALTER COLUMN end_date SET NOT NULL;

-- Add check constraint to ensure end_date is not before start_date
ALTER TABLE work_hours_log 
ADD CONSTRAINT work_hours_log_date_range_check 
CHECK (end_date >= start_date);

-- Create index for better performance on date range queries
CREATE INDEX IF NOT EXISTS idx_work_hours_log_date_range 
ON work_hours_log(start_date, end_date);

-- Update comments
COMMENT ON COLUMN work_hours_log.start_date IS 'Start date of work period';
COMMENT ON COLUMN work_hours_log.end_date IS 'End date of work period';
COMMENT ON COLUMN work_hours_log.start_time IS 'Start time with AM/PM (e.g., 09:00:00 for 9:00 AM)';
COMMENT ON COLUMN work_hours_log.end_time IS 'End time with AM/PM (e.g., 17:30:00 for 5:30 PM)';
