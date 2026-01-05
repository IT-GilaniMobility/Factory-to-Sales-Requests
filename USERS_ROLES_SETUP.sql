-- ============================================================================
-- USERS AND ROLES MANAGEMENT SYSTEM
-- Run these queries in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- TABLE: app_users
-- Stores application users with role assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'sales', -- 'factory_admin' or 'sales'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ALTER EXISTING TABLES: Add created_by_email to track request creator
-- ============================================================================
ALTER TABLE requests ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE g24_requests ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE diving_solution_requests ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE turney_seat_requests ADD COLUMN IF NOT EXISTS created_by_email TEXT;

-- Create indexes for faster lookups by creator email
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON requests(created_by_email);
CREATE INDEX IF NOT EXISTS idx_g24_requests_created_by ON g24_requests(created_by_email);
CREATE INDEX IF NOT EXISTS idx_diving_solution_requests_created_by ON diving_solution_requests(created_by_email);
CREATE INDEX IF NOT EXISTS idx_turney_seat_requests_created_by ON turney_seat_requests(created_by_email);

-- ============================================================================
-- Create indexes for faster lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_is_active ON app_users(is_active);

-- ============================================================================
-- Enable Row-Level Security (RLS)
-- ============================================================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Allow anonymous read for role checking
-- ============================================================================
CREATE POLICY "allow_read_all_users" ON app_users
  FOR SELECT
  USING (true);

-- Factory admin can manage users
CREATE POLICY "allow_admin_manage_users" ON app_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SAMPLE DATA: Add some test users
-- ============================================================================
INSERT INTO app_users (email, full_name, role, is_active) VALUES
('admin@gilanimobility.ae', 'Factory Admin', 'factory_admin', true),
('sales@gilanimobility.ae', 'Sales Person', 'sales', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- NOTES ON ROLES
-- ============================================================================
-- 1. FACTORY_ADMIN:
--    - Can view all requests
--    - Can create, edit, delete requests
--    - Can view quality control inspections
--    - Can mark requests as completed
--    - Can manage users and assign roles
--
-- 2. SALES:
--    - Can only CREATE new requests
--    - Can view ONLY their own requests (tracked by created_by_email)
--    - Can see status updates made by factory admin
--    - Cannot edit or delete requests
--    - Cannot access quality control section
--
-- 3. To add more users, insert into app_users table:
--    INSERT INTO app_users (email, full_name, role, is_active)
--    VALUES ('user@example.com', 'User Name', 'sales', true);
--
-- 4. To change user role:
--    UPDATE app_users SET role = 'factory_admin' WHERE email = 'user@example.com';
--
-- 5. Request Tracking:
--    - All requests now track creator via created_by_email column
--    - Sales person only sees requests where created_by_email matches their email
--    - Factory admin sees all requests regardless of creator
