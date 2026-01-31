CREATE TABLE IF NOT EXISTS delivery_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL, -- stores request_code (e.g., WL-20260108-T1EL)
  request_type VARCHAR(50) NOT NULL, -- 'wheelchair', 'g24', 'diving_solution', 'turney_seat'
  delivery_date TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_transit', 'delivered', 'cancelled'
  notes TEXT,
  recipient_name VARCHAR(255),
  recipient_contact VARCHAR(100),
  delivery_address TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT delivery_notes_request_check CHECK (request_type IN ('wheelchair', 'g24', 'diving_solution', 'turney_seat'))
);

CREATE TABLE IF NOT EXISTS work_hours_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT, -- stores request_code (e.g., WL-20260108-T1EL) - OPTIONAL
  request_type VARCHAR(50) DEFAULT 'general', -- 'wheelchair', 'g24', 'diving_solution', 'turney_seat', or 'general'
  employee_name VARCHAR(255) NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL, -- e.g., 8.5 hours
  work_date DATE NOT NULL,
  start_time TIME, -- Start time of work (e.g., 09:00:00)
  end_time TIME, -- End time of work (e.g., 17:30:00)
  task_description TEXT,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT work_hours_log_hours_check CHECK (hours_worked > 0 AND hours_worked <= 24)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_notes_request ON delivery_notes(request_id, request_type);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_status ON delivery_notes(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON delivery_notes(delivery_date);
CREATE INDEX IF NOT EXISTS idx_work_hours_log_request ON work_hours_log(request_id, request_type);
CREATE INDEX IF NOT EXISTS idx_work_hours_log_employee ON work_hours_log(employee_name);
CREATE INDEX IF NOT EXISTS idx_work_hours_log_date ON work_hours_log(work_date);

-- Enable Row Level Security (RLS)
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_hours_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users to read/write)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON delivery_notes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON delivery_notes;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON delivery_notes;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON delivery_notes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON work_hours_log;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON work_hours_log;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON work_hours_log;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON work_hours_log;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON delivery_notes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON delivery_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON delivery_notes
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON delivery_notes
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON work_hours_log
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON work_hours_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON work_hours_log
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON work_hours_log
  FOR DELETE USING (true);

-- Comments
COMMENT ON TABLE delivery_notes IS 'Stores delivery information and tracking for work requests';
COMMENT ON TABLE work_hours_log IS 'Tracks employee work hours on each job card';
COMMENT ON COLUMN delivery_notes.request_type IS 'Type of request: wheelchair, g24, diving_solution, or turney_seat';
COMMENT ON COLUMN work_hours_log.hours_worked IS 'Number of hours worked (decimal, e.g., 8.5)';
