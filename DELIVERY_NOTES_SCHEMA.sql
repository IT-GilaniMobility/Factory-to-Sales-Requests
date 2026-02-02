-- DELIVERY NOTES SCHEMA FOR GILANI MOBILITY
-- This schema is adapted for the existing "requests"-based workflow in this app.
-- Each delivery note is linked to a request via request_code (job card analogue).

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS delivery_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to job card / request
  request_code TEXT NOT NULL, -- corresponds to requests.request_code / g24_requests.request_code etc.
  request_type TEXT NOT NULL DEFAULT 'Wheelchair Lifter Installation',

  -- Document Info
  approval_number TEXT NOT NULL UNIQUE, -- e.g. GM-OPD-01
  version TEXT NOT NULL DEFAULT 'V1.0',
  document_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Company Details
  company_name TEXT NOT NULL DEFAULT 'Gilani Mobility',
  company_phone1 TEXT NOT NULL DEFAULT '+97148818426',
  company_phone2 TEXT NOT NULL DEFAULT '+971543200677',
  company_email TEXT NOT NULL DEFAULT 'sales@gilanimobility.ae',
  company_trn TEXT NOT NULL DEFAULT '104019044700003',
  company_address TEXT NOT NULL DEFAULT '9 17th St. Umm Ramool, Dubai',

  -- Customer Details
  customer_name TEXT NOT NULL,
  customer_vin TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  -- Modifications / Items (stored as JSONB array)
  -- Example: [{"description": "Seat Modification", "quantity": 1, "notes": ""}]
  modifications JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Status & Approvals
  financial_cleared BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT,
  pdi_done_by TEXT,
  job_card_number TEXT, -- e.g. JC230120261216 (can mirror request_code)
  invoice_number TEXT,
  payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Notes
  notes TEXT,

  -- Signature & Receipt
  received_by TEXT,
  received_date DATE,
  signature_data TEXT, -- Base64 encoded signature image

  -- PDF Storage
  pdf_url TEXT,

  -- Metadata
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one delivery note per request_code
  UNIQUE(request_code)
);

-- Optional: index for faster lookups by request_code
CREATE INDEX IF NOT EXISTS idx_delivery_notes_request_code
  ON delivery_notes (request_code);

ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;

-- Basic policy: creator can see their own notes
CREATE POLICY "delivery_notes_select_own"
  ON delivery_notes FOR SELECT
  USING (auth.uid() = created_by);

-- Allow creators to insert their own notes
CREATE POLICY "delivery_notes_insert_own"
  ON delivery_notes FOR INSERT
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Allow creators to update their own notes
CREATE POLICY "delivery_notes_update_own"
  ON delivery_notes FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- NOTE: If you have an explicit roles/users table for admins, you can
-- add additional admin policies, for example:
--
-- CREATE POLICY "delivery_notes_admin_all"
--   ON delivery_notes FOR ALL
--   USING (EXISTS (
--     SELECT 1 FROM users u
--     WHERE u.id = auth.uid() AND u.role = 'admin'
--   ));
--
-- Adjust this according to your existing roles schema.
