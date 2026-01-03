-- ============================================================================
-- QUALITY CONTROL INSPECTION SYSTEM FOR SUPABASE
-- Run these queries in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- TABLE: qc_categories
-- Stores quality control inspection categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS qc_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: qc_checklist_items
-- Stores checklist items for each category
-- ============================================================================
CREATE TABLE IF NOT EXISTS qc_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES qc_categories(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_description TEXT,
  sequence_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: qc_inspections
-- Stores quality control inspection records linked to job requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS qc_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'Wheelchair Lifter Installation', 'The Ultimate G24', etc.
  inspection_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'passed', 'failed'
  inspector_name TEXT,
  inspection_date TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- JSON payload for all inspection details
  payload JSONB,
  
  CONSTRAINT fk_qc_inspection_request UNIQUE(request_code)
);

-- ============================================================================
-- TABLE: qc_inspection_items
-- Stores individual inspection item results
-- ============================================================================
CREATE TABLE IF NOT EXISTS qc_inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES qc_inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES qc_checklist_items(id),
  category_id UUID NOT NULL REFERENCES qc_categories(id),
  item_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'pass', 'fail'
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Create indexes for faster lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_qc_inspections_request_code ON qc_inspections(request_code);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_status ON qc_inspections(inspection_status);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_inspector ON qc_inspections(inspector_name);
CREATE INDEX IF NOT EXISTS idx_qc_inspection_items_inspection_id ON qc_inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qc_inspection_items_status ON qc_inspection_items(status);
CREATE INDEX IF NOT EXISTS idx_qc_checklist_items_category ON qc_checklist_items(category_id);

-- ============================================================================
-- SEED DATA: Quality Control Categories for Hand Controls (Push/Pull)
-- ============================================================================
INSERT INTO qc_categories (category_name, description) VALUES
('Visual Inspection', 'Visual checks for physical condition and installation'),
('Functional Testing', 'Testing operational functionality of hand controls'),
('Video Documentation', 'Video recording requirements'),
('Safety Checks', 'Safety verification and clearance checks'),
('Marketing', 'Marketing materials and documentation')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Inspection Checklist Items for Hand Controls (Push/Pull)
-- ============================================================================
INSERT INTO qc_checklist_items (category_id, item_name, item_description, sequence_order)
-- Visual Inspection Items (1-3)
SELECT id, 'Inspect for scratches, dents, or visual defects', 'Check overall physical condition', 1 
FROM qc_categories WHERE category_name = 'Visual Inspection'
UNION ALL
SELECT id, 'Ensure mounting brackets are securely installed and do not obstruct critical vehicle functions', 'Verify bracket installation and clearance', 2 
FROM qc_categories WHERE category_name = 'Visual Inspection'
UNION ALL
SELECT id, 'Verify all bolts, brackets, and connections are secure', 'Check all fasteners and connections', 3 
FROM qc_categories WHERE category_name = 'Visual Inspection'

UNION ALL

-- Functional Testing Items (4-9)
SELECT id, 'Adjust lever position for client''s comfort and reach', 'Ensure ergonomic positioning for client', 4 
FROM qc_categories WHERE category_name = 'Functional Testing'
UNION ALL
SELECT id, 'Test brake and throttle response to confirm correct operation of the system', 'Verify system response', 5 
FROM qc_categories WHERE category_name = 'Functional Testing'
UNION ALL
SELECT id, 'Test the brake function in hand control when its in maximum, the brake pedal must be in maximum position also', 'Full brake test', 6 
FROM qc_categories WHERE category_name = 'Functional Testing'
UNION ALL
SELECT id, 'Test the accelerator function in hand control when its in maximum, the accelerator pedal must be in maximum position also', 'Full accelerator test', 7 
FROM qc_categories WHERE category_name = 'Functional Testing'
UNION ALL
SELECT id, 'Test the movement of the Driver seat and check underneath the driver seat, make sure the hand control and the base doesnt disrupt the movement the driver seat', 'Driver seat movement clearance check', 8 
FROM qc_categories WHERE category_name = 'Functional Testing'

UNION ALL

-- Video Documentation (10)
SELECT id, 'Video taken', 'Record video demonstration of hand control operation', 10 
FROM qc_categories WHERE category_name = 'Video Documentation'

UNION ALL

-- Safety Checks (11-12)
SELECT id, 'Test hand controls in a safe environment to ensure proper braking and acceleration "make sure the car on P and hand brake active"', 'Safety test with parking brake', 11 
FROM qc_categories WHERE category_name = 'Safety Checks'
UNION ALL
SELECT id, 'Verify that steering wheel and other vehicle functions are not obstructed by the installed system', 'Check for obstructions', 12 
FROM qc_categories WHERE category_name = 'Safety Checks'

UNION ALL

-- Marketing Items (13-14)
SELECT id, 'Demonstrate how to use push/pull hand controls properly', 'Client demonstration and training', 13 
FROM qc_categories WHERE category_name = 'Marketing'
UNION ALL
SELECT id, 'Confirm all Company stickers are properly placed', 'Verify branding placement', 14 
FROM qc_categories WHERE category_name = 'Marketing'
UNION ALL
SELECT id, 'Check with marketing team for needed material', 'Marketing materials verification', 15 
FROM qc_categories WHERE category_name = 'Marketing'

ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTES ON IMPLEMENTATION
-- ============================================================================
-- 1. Each job request (from requests, g24_requests, diving_solution_requests, turney_seat_requests)
--    is linked to ONE quality control inspection via request_code
--
-- 2. To create a QC inspection for a job:
--    a. Create record in qc_inspections with request_code
--    b. Fetch all qc_categories
--    c. For each category, fetch qc_checklist_items
--    d. Create qc_inspection_items for each checklist item with status 'pending'
--
-- 3. Inspector updates status and comments for each qc_inspection_item
--
-- 4. Inspection is considered:
--    - PASSED: All items have status 'pass'
--    - FAILED: At least one item has status 'fail'
--    - IN PROGRESS: At least one item is still 'pending'
--
-- 5. Inspectors available: 'Hasan', 'Jay Jay' (stored in qc_inspections.inspector_name)
--
-- 6. Dashboard shows:
--    - Light green with ✓ icon if inspection_status = 'passed'
--    - Light yellow if inspection_status = 'failed'
--    - Gray if inspection_status = 'pending' or 'in_progress'
