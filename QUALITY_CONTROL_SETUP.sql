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
  template_name TEXT NOT NULL,
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
  template_name TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_qc_categories_template ON qc_categories(template_name);
CREATE INDEX IF NOT EXISTS idx_qc_checklist_items_template ON qc_checklist_items(template_name);
CREATE INDEX IF NOT EXISTS idx_qc_inspection_items_inspection_id ON qc_inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qc_inspection_items_status ON qc_inspection_items(status);
CREATE INDEX IF NOT EXISTS idx_qc_checklist_items_category ON qc_checklist_items(category_id);

-- Backfill template_name for legacy rows (assume original Hand Control template)
ALTER TABLE qc_categories ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE qc_checklist_items ADD COLUMN IF NOT EXISTS template_name TEXT;
UPDATE qc_categories SET template_name = COALESCE(template_name, 'Hand Control (Push/Pull)');
UPDATE qc_checklist_items SET template_name = COALESCE(template_name, 'Hand Control (Push/Pull)');

-- ============================================================================
-- SEED DATA: Quality Control Categories for Hand Controls (Push/Pull)
-- ============================================================================
INSERT INTO qc_categories (category_name, description, template_name) VALUES
('Visual Inspection', 'Visual checks for physical condition and installation', 'Hand Control (Push/Pull)'),
('Functional Testing', 'Testing operational functionality of hand controls', 'Hand Control (Push/Pull)'),
('Video Documentation', 'Video recording requirements', 'Hand Control (Push/Pull)'),
('Safety Checks', 'Safety verification and clearance checks', 'Hand Control (Push/Pull)'),
('Marketing', 'Marketing materials and documentation', 'Hand Control (Push/Pull)')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Inspection Checklist Items for Hand Controls (Push/Pull)
-- ============================================================================
INSERT INTO qc_checklist_items (category_id, item_name, item_description, sequence_order, template_name)
-- Visual Inspection Items (1-3)
SELECT id, 'Inspect for scratches, dents, or visual defects', 'Check overall physical condition', 1, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Ensure mounting brackets are securely installed and do not obstruct critical vehicle functions', 'Verify bracket installation and clearance', 2, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Verify all bolts, brackets, and connections are secure', 'Check all fasteners and connections', 3, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Hand Control (Push/Pull)'

UNION ALL

-- Functional Testing Items (4-9)
SELECT id, 'Adjust lever position for client''s comfort and reach', 'Ensure ergonomic positioning for client', 4, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Test brake and throttle response to confirm correct operation of the system', 'Verify system response', 5, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Test the brake function in hand control when its in maximum, the brake pedal must be in maximum position also', 'Full brake test', 6, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Test the accelerator function in hand control when its in maximum, the accelerator pedal must be in maximum position also', 'Full accelerator test', 7, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Test the movement of the Driver seat and check underneath the driver seat, make sure the hand control and the base doesnt disrupt the movement the driver seat', 'Driver seat movement clearance check', 8, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Hand Control (Push/Pull)'

UNION ALL

-- Video Documentation (10)
SELECT id, 'Video taken', 'Record video demonstration of hand control operation', 10, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Video Documentation' AND template_name = 'Hand Control (Push/Pull)'

UNION ALL

-- Safety Checks (11-12)
SELECT id, 'Test hand controls in a safe environment to ensure proper braking and acceleration "make sure the car on P and hand brake active"', 'Safety test with parking brake', 11, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Safety Checks' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Verify that steering wheel and other vehicle functions are not obstructed by the installed system', 'Check for obstructions', 12, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Safety Checks' AND template_name = 'Hand Control (Push/Pull)'

UNION ALL

-- Marketing Items (13-14)
SELECT id, 'Demonstrate how to use push/pull hand controls properly', 'Client demonstration and training', 13, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Confirm all Company stickers are properly placed', 'Verify branding placement', 14, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Hand Control (Push/Pull)'
UNION ALL
SELECT id, 'Check with marketing team for needed material', 'Marketing materials verification', 15, 'Hand Control (Push/Pull)'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Hand Control (Push/Pull)'

ON CONFLICT DO NOTHING;

-- =========================================================================
-- SCHEMA SAFETY: ensure template_name columns exist for existing deployments
-- =========================================================================
ALTER TABLE qc_categories ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE qc_checklist_items ADD COLUMN IF NOT EXISTS template_name TEXT;

-- =========================================================================
-- SEED DATA: Quality Control Categories for Left Foot Acceleration
-- =========================================================================
INSERT INTO qc_categories (category_name, description, template_name) VALUES
('Visual Inspection', 'Visual checks for physical condition and installation', 'Left Foot Acceleration'),
('Functional Testing', 'Operational checks for LFA pedal', 'Left Foot Acceleration'),
('Safety Checks', 'Safety and clearance verification', 'Left Foot Acceleration'),
('DOC', 'Documentation and media', 'Left Foot Acceleration'),
('Marketing', 'Branding and marketing verification', 'Left Foot Acceleration')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: Inspection Checklist Items for Left Foot Acceleration
-- =========================================================================
INSERT INTO qc_checklist_items (category_id, item_name, item_description, sequence_order, template_name)
-- Visual Inspection
SELECT id, 'Inspect for scratches, dents, or visual defects', NULL, 1, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Left Foot Acceleration'
UNION ALL
SELECT id, 'Ensure paint and coating are smooth and durable', NULL, 2, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Left Foot Acceleration'

UNION ALL

-- Functional Testing
SELECT id, 'Ensure the LFA does not interfere with other vehicle controls.', NULL, 3, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Left Foot Acceleration'
UNION ALL
SELECT id, 'Ensure LFA pedal operates without delay or sticking', NULL, 4, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Left Foot Acceleration'
UNION ALL
SELECT id, 'Verify the right-foot accelerator is still functional', NULL, 5, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Left Foot Acceleration'
UNION ALL
SELECT id, 'Verify when the LFA in maximum position the accelerator pedal must be in the maximum position', NULL, 6, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Left Foot Acceleration'

UNION ALL

-- Safety Checks
SELECT id, 'Verify all bolts, brackets, and connections are secure', NULL, 7, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Safety Checks' AND template_name = 'Left Foot Acceleration'
UNION ALL
SELECT id, 'Confirm no interference with driver''s pedals or cabin space', NULL, 8, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Safety Checks' AND template_name = 'Left Foot Acceleration'

UNION ALL

-- DOC
SELECT id, 'Take a full Video', NULL, 9, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'DOC' AND template_name = 'Left Foot Acceleration'

UNION ALL

-- Marketing
SELECT id, 'Confirm all Company stickers  are  properly placed.', NULL, 10, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Left Foot Acceleration'
UNION ALL
SELECT id, 'check with marketing team for needed material', NULL, 11, 'Left Foot Acceleration'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Left Foot Acceleration'

ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: Quality Control Categories for Remote Light and Indicators
-- =========================================================================
INSERT INTO qc_categories (category_name, description, template_name) VALUES
('Visual Inspection', 'Visual checks for physical condition and installation', 'Remote Light and Indicators'),
('Functional Testing', 'Operational checks for remote control system', 'Remote Light and Indicators'),
('Safety Checks', 'Safety and clearance verification', 'Remote Light and Indicators'),
('Marketing', 'Branding and marketing verification', 'Remote Light and Indicators')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: Inspection Checklist Items for Remote Light and Indicators
-- =========================================================================
INSERT INTO qc_checklist_items (category_id, item_name, item_description, sequence_order, template_name)
-- Visual Inspection (1-3)
SELECT id, 'Inspect for scratches, dents, or visual defects', NULL, 1, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'Ensure the CL007 is securely attached to the steering wheel', NULL, 2, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'Ensure the CL007 is can be inserted or removed easily.', NULL, 3, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Visual Inspection' AND template_name = 'Remote Light and Indicators'

UNION ALL

-- Functional Testing (4-6)
SELECT id, 'Test Light control button functionality (indicators,light, hazard).', NULL, 4, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'Test horn for proper sound and responsiveness.', NULL, 5, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'Test windshield wiper functionality (Multiple speeds, Auto mode).', NULL, 6, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Remote Light and Indicators'

UNION ALL

-- Safety Checks (7-8)
SELECT id, 'Verify that steering wheel and other vehicle functions are not obstructed by the installed system.', NULL, 7, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Safety Checks' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'Check for any warning lights on the dashboard', NULL, 8, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Safety Checks' AND template_name = 'Remote Light and Indicators'

UNION ALL

-- Marketing (9-11)
SELECT id, 'Demonstrate how to use controls properly', NULL, 9, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'Confirm all Company stickers  are  properly placed.', NULL, 10, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Remote Light and Indicators'
UNION ALL
SELECT id, 'check with marketing team for needed material', NULL, 11, 'Remote Light and Indicators'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Remote Light and Indicators'

ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: Quality Control Categories for G24 Conversions
-- =========================================================================
INSERT INTO qc_categories (category_name, description, template_name) VALUES
('Invoice & Vehicle Info', 'Invoice and vehicle identification details', 'G24 Conversions'),
('Interior Check', 'Interior components and functionality verification', 'G24 Conversions'),
('Exterior Check', 'Exterior components and bodywork verification', 'G24 Conversions'),
('Under Body Check', 'Underbody components and safety checks', 'G24 Conversions'),
('Personnel & Sign-off', 'Personnel information and final approval', 'G24 Conversions'),
('Fault Rectification', 'Issues and work to be completed', 'G24 Conversions')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: Inspection Checklist Items for G24 Conversions
-- =========================================================================
INSERT INTO qc_checklist_items (category_id, item_name, item_description, sequence_order, template_name)
-- Invoice & Vehicle Info (1-4) - TEXT FIELDS ONLY
SELECT id, 'INVOICE NO.', 'text_field', 1, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Invoice & Vehicle Info' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'REGO', 'text_field', 2, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Invoice & Vehicle Info' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'VIN', 'text_field', 3, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Invoice & Vehicle Info' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Conversion type', 'text_field', 4, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Invoice & Vehicle Info' AND template_name = 'G24 Conversions'

UNION ALL

-- Interior Check (5-27)
SELECT id, 'Check the user manual in the glove box.', NULL, 5, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Fuel in and check gauge registers fuel.', NULL, 6, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Wiring to ramp, battery terminals and proper fuses fitted.', NULL, 7, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check for errors on dashboard.', NULL, 8, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'All Electrical OE doors, windows, sensors and cameras.', NULL, 9, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Front seats installed correctly and securely. Electrical plugs connected and secure.', NULL, 10, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Second row seats installed correctly and securely. Electrical plugs connected and secure.', NULL, 11, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Side fold seat installed correctly, secure and not rubbing. Retaining strap fitted.', NULL, 12, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check the operation of all seats.', NULL, 13, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Seat belt post and seat belt fitted including stalk.', NULL, 14, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Restraints and occupant seat belt supplied.', NULL, 15, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check all seat belts including wheelchair restraints are retracting and locking.', NULL, 16, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Jack and tools fitted.', NULL, 17, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Inside trim finished, no glue and no loose carpets.', NULL, 18, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Interior plastic trims fitted and secure.', NULL, 19, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Ramp switches, electric restraints, docking station and floor lights working.', NULL, 20, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Ramp seals and proper ramp closed tension.', NULL, 21, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Rubbers on bracket tailgate to backdoor.', NULL, 22, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Back door closing properly and sealing well.', NULL, 23, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check around the tailgate seal for light and rectify with a rubber seal or brush seal.', NULL, 24, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Supply tyre repair kit and break glass hammer.', NULL, 25, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check Automatic Tailgate is working properly and suction lock is engaging as intended.', NULL, 26, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check the length of the seatbelt is correct and properly fits an occupant.', NULL, 27, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Interior Check' AND template_name = 'G24 Conversions'

UNION ALL

-- Exterior Check (28-35)
SELECT id, 'GE Logo and Stickers - emergency access, conversion spec sticker, Disability sticker, Gilani 3D logo to tailgate.', NULL, 28, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Coolant bleed 10min after fans kicks in and rev 2500rpm.', NULL, 29, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Coolant level.', NULL, 30, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Centre Bumper cover fitted properly and aligned.', NULL, 31, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Back door closing properly and aligned.', NULL, 32, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check all masking has been removed.', NULL, 33, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check bodywork for damage.', NULL, 34, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Under the bonnet, all levels checked, wiring secure and fuses fitted.', NULL, 35, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Exterior Check' AND template_name = 'G24 Conversions'

UNION ALL

-- Under Body Check (36-59)
SELECT id, 'Wheel sensor connectors secure.', NULL, 36, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Handbrake fitted and adjusted.', NULL, 37, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Fuel tank bolts and hoses tight.', NULL, 38, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Fuel hoses are secure, protected when touching bodywork and no leaks.', NULL, 39, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Exhaust secure and good clearance from other components.', NULL, 40, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Heat shield between fuel tank and exhaust if the gap is less than 150mm.', NULL, 41, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Touch up any scratched paint.', NULL, 42, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Spare tyre fitted.', NULL, 43, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Brake fluid level check.', NULL, 44, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Brake line clearance to tire.', NULL, 45, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Brake lines are secure and not rubbing against bodywork.', NULL, 46, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Handbrake and wheel sensor clamped securely.', NULL, 47, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Rear heater hoses are secure, protected where touching bodywork and no leaks.', NULL, 48, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Fuel hoses are secure, protected when touching bodywork and no leaks.', NULL, 49, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Suspension clearance to box, MUST BE NOT LESS THAN 40MM.', NULL, 50, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Bolt check on suspension check for tightness and mark as checked.', NULL, 51, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Suspension alignment.', NULL, 52, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Wheel alignment.', NULL, 53, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Wheel nuts torqued to required settings.', NULL, 54, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check Springs are Tight while vehicle is airborne and raised all the way up on hoist.', NULL, 55, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Test drive to check suspension and air in brakes.', NULL, 56, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Fill the fuel tank to maximum, check the fuel gauge and final check for leaks.', NULL, 57, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check G24 Actuator Mounts are Secure not touching anything during operation.', NULL, 58, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Check ground clearance at rear (approx 230mm).', NULL, 59, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Under Body Check' AND template_name = 'G24 Conversions'

UNION ALL

-- Personnel & Sign-off (60-63) - TEXT FIELDS ONLY
SELECT id, 'Built by:', 'text_field', 60, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Personnel & Sign-off' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Inspected by:', 'text_field', 61, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Personnel & Sign-off' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Certifier:', 'text_field', 62, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Personnel & Sign-off' AND template_name = 'G24 Conversions'
UNION ALL
SELECT id, 'Checked off by:', 'text_field', 63, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Personnel & Sign-off' AND template_name = 'G24 Conversions'

UNION ALL

-- Fault Rectification (64) - TEXT AREA ONLY
SELECT id, 'Fault rectification and work still to do list:', 'textarea_field', 64, 'G24 Conversions'
FROM qc_categories WHERE category_name = 'Fault Rectification' AND template_name = 'G24 Conversions'

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

-- =========================================================================
-- SEED DATA: Quality Control Categories for Turney Seat Installation
-- =========================================================================
INSERT INTO qc_categories (category_name, description, template_name) VALUES
('Installation Verification', 'Verify physical installation and alignment of components', 'Turney Seat Installation'),
('Functional Testing', 'Test seat rotation, extension, and powered functions', 'Turney Seat Installation'),
('Safety Features', 'Verify seat belt integration and capacity warnings', 'Turney Seat Installation'),
('Electrical Check', 'Confirm wiring and remote positioning', 'Turney Seat Installation'),
('Aesthetic Inspection', 'Cleanliness and cosmetic condition checks', 'Turney Seat Installation'),
('Client Demonstration', 'Demonstrate operation to client', 'Turney Seat Installation'),
('Documentation', 'Provide manuals, warranty, and media', 'Turney Seat Installation'),
('Final Client Confirmation', 'Walk-through and client satisfaction sign-off', 'Turney Seat Installation'),
('Post-Delivery Support', 'Provide support contact information', 'Turney Seat Installation'),
('Marketing', 'Branding and marketing materials verification', 'Turney Seat Installation')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: Inspection Checklist Items for Turney Seat Installation
-- =========================================================================
INSERT INTO qc_checklist_items (category_id, item_name, item_description, sequence_order, template_name)
-- Installation Verification (1-3)
SELECT id, 'Ensure the Turney Seat is securely installed according to specifications.', NULL, 1, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Installation Verification' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Verify bolts, brackets, and components are tightened and aligned properly.', NULL, 2, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Installation Verification' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Ensure the sensor mounted to the door is in a good position.', NULL, 3, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Installation Verification' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Functional Testing (4-5)
SELECT id, 'Test rotation and extension for smooth operation with doors closed/open, with and without weight.', NULL, 4, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Verify motorized functions (rotation, height adjustment, etc.) work properly.', NULL, 5, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Functional Testing' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Safety Features (6-7)
SELECT id, 'Inspect seat belt integration for alignment and functionality.', NULL, 6, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Safety Features' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Check weight capacity limits and provide warnings for overloading.', NULL, 7, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Safety Features' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Electrical Check (8-9)
SELECT id, 'Ensure all wiring is correctly installed and secure.', NULL, 8, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Electrical Check' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Position the remote mount correctly in the car.', NULL, 9, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Electrical Check' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Aesthetic Inspection (10-11)
SELECT id, 'Clean the seat and surrounding vehicle area.', NULL, 10, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Aesthetic Inspection' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Check for scratches, dents, or damages on the seat.', NULL, 11, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Aesthetic Inspection' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Client Demonstration (12)
SELECT id, 'Demonstrate operating the seat (manual or electric controls).', NULL, 12, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Client Demonstration' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Documentation (13,16)
SELECT id, 'Provide all user manuals and warranty documents.', NULL, 13, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Documentation' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Take video after installing the product.', NULL, 16, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Documentation' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Final Client Confirmation (14)
SELECT id, 'Walk through the checklist with the client for confirmation and satisfaction.', NULL, 14, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Final Client Confirmation' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Post-Delivery Support (15)
SELECT id, 'Provide contact information for customer service or technical support.', NULL, 15, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Post-Delivery Support' AND template_name = 'Turney Seat Installation'

UNION ALL

-- Marketing (17-18)
SELECT id, 'Confirm all Company stickers are properly placed.', NULL, 17, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Turney Seat Installation'
UNION ALL
SELECT id, 'Check with marketing team for needed material.', NULL, 18, 'Turney Seat Installation'
FROM qc_categories WHERE category_name = 'Marketing' AND template_name = 'Turney Seat Installation'

ON CONFLICT DO NOTHING;
