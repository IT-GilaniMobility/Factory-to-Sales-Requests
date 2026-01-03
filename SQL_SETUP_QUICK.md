# Quick SQL Setup - Copy & Paste into Supabase SQL Editor

Run this entire script in your Supabase SQL Editor to create all necessary tables.

```sql
-- ============================================================================
-- CREATE ULTIMATE G24 TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS g24_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Requested to factory',
  
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quote_ref TEXT NOT NULL,
  
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  
  product_model TEXT,
  product_model_other TEXT,
  
  second_row_seat TEXT,
  second_row_seat_other TEXT,
  
  tie_down TEXT,
  tie_down_other TEXT,
  
  floor_add_on TEXT,
  floor_add_on_other TEXT,
  
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_g24_request_code ON g24_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_g24_customer_mobile ON g24_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_g24_quote_ref ON g24_requests(quote_ref);
CREATE INDEX IF NOT EXISTS idx_g24_created_at ON g24_requests(created_at DESC);


-- ============================================================================
-- CREATE DIVING SOLUTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS diving_solution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Requested to factory',
  
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quote_ref TEXT NOT NULL,
  
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  
  device_model TEXT NOT NULL,
  installation_location TEXT,
  driver_seat_position TEXT,
  steering_wheel_position TEXT,
  
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diving_request_code ON diving_solution_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_diving_customer_mobile ON diving_solution_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_diving_quote_ref ON diving_solution_requests(quote_ref);
CREATE INDEX IF NOT EXISTS idx_diving_created_at ON diving_solution_requests(created_at DESC);


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE g24_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diving_solution_requests ENABLE ROW LEVEL SECURITY;

-- G24 Requests Policies
CREATE POLICY "allow_anonymous_insert_g24" ON g24_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_anonymous_select_g24" ON g24_requests
  FOR SELECT USING (true);

CREATE POLICY "allow_anonymous_update_g24" ON g24_requests
  FOR UPDATE USING (true);

-- Diving Solution Requests Policies
CREATE POLICY "allow_anonymous_insert_diving" ON diving_solution_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_anonymous_select_diving" ON diving_solution_requests
  FOR SELECT USING (true);

CREATE POLICY "allow_anonymous_update_diving" ON diving_solution_requests
  FOR UPDATE USING (true);
```

## Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to https://supabase.com and sign in
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste**
   - Select all the SQL code above
   - Paste into the Supabase SQL Editor

4. **Execute**
   - Click "Run" button or press Ctrl+Enter
   - You should see success messages for each table creation

5. **Verify**
   - Go to "Tables" section in left sidebar
   - You should see three new tables:
     - `g24_requests`
     - `diving_solution_requests`
     - (and your existing `requests` table)

## Testing After Setup

After running SQL, test the application:

1. Go to http://localhost:3000
2. Create a new request
3. Select "The Ultimate G24" as job request type
4. Fill in all required fields
5. Submit the request
6. Check that it appears in the dashboard
7. Verify in Supabase: Tables → g24_requests → should see the new record

## If Something Goes Wrong

### Error: "relation does not exist"
- The tables weren't created. Run the SQL again.

### Error: "duplicate key value violates unique constraint"
- The request code already exists. This shouldn't happen in normal use, but if it does, try submitting again with the app's "Generate New Code" logic.

### Can't see requests in dashboard
- Clear browser cache (Cmd+Shift+R on Mac)
- Check browser console for errors (F12)
- Check Supabase SQL Editor to verify tables exist

### Tables created but requests not showing
- Make sure you submitted new requests AFTER tables were created
- Old requests went to the old `requests` table and won't show up
- Submit a new request to test with the new tables

## Support Queries

If you need to check what's in the database:

```sql
-- View all requests across all types
SELECT request_code, status, customer_name, created_at FROM g24_requests
UNION ALL
SELECT request_code, status, customer_name, created_at FROM diving_solution_requests
ORDER BY created_at DESC;

-- View only G24 requests
SELECT request_code, status, customer_name, product_model, second_row_seat 
FROM g24_requests 
ORDER BY created_at DESC;

-- View only Diving Solution requests
SELECT request_code, status, customer_name, device_model, installation_location 
FROM diving_solution_requests 
ORDER BY created_at DESC;

-- Count requests by type
SELECT 
  'G24' as type, COUNT(*) as count FROM g24_requests
UNION ALL
SELECT 
  'Diving Solution' as type, COUNT(*) as count FROM diving_solution_requests
UNION ALL
SELECT 
  'Wheelchair Lifter' as type, COUNT(*) as count FROM requests;
```
