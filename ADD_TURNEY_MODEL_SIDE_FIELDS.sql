-- Migration: Add explicit model/side fields to turney_seat_requests
ALTER TABLE turney_seat_requests
  ADD COLUMN IF NOT EXISTS turney_model TEXT,
  ADD COLUMN IF NOT EXISTS side_highlight TEXT,
  ADD COLUMN IF NOT EXISTS side_location TEXT;

-- Optionally, backfill from payload if needed (example for Postgres >= 12):
-- UPDATE turney_seat_requests
--   SET turney_model = payload->>'turneyModel',
--       side_highlight = payload->>'sideHighlight',
--       side_location = payload->>'sideLocation'
--   WHERE turney_model IS NULL OR side_highlight IS NULL OR side_location IS NULL;
