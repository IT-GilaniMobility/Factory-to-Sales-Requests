# Delivery & Work Hours Setup Guide

## Overview
New features have been added to track delivery notes and employee work hours for each job card.

## Database Setup Required

### Step 1: Run SQL Schema
Execute the SQL script in Supabase to create the new tables:

**File:** `DELIVERY_WORK_HOURS_SCHEMA.sql`

**Location:** Run this in Supabase Dashboard → SQL Editor

This will create:
- `delivery_notes` table - Tracks delivery information for each request
- `work_hours_log` table - Tracks employee hours worked on each job card
- Proper indexes for performance
- Row Level Security (RLS) policies

### Step 2: Verify Tables
After running the SQL, verify in Supabase Dashboard → Table Editor that both tables exist:
- ✅ delivery_notes
- ✅ work_hours_log

## New Features

### 1. Modern Login Page
- **Left Side (50%):** Machine image with company branding
- **Right Side (50%):** Clean, modern login form
- Full-screen fitted design
- Supports both username/password and Google OAuth

### 2. Delivery Notes (Job Card Level)
Each job card in RequestDetails now has a "Delivery Notes" section where you can:
- Add delivery information (status, tracking number, date)
- Track recipient details (name, contact, address)
- Update delivery status: Pending → In Transit → Delivered
- Add notes for each delivery
- Edit or delete delivery notes

**Access:** Open any request from /requests → Scroll to "Delivery Notes" section

### 3. Work Hours Tracking (Job Card Level)
Each job card has a "Work Hours Log" section to:
- Log employee hours worked
- Record task descriptions
- Add work date and additional notes
- View total hours worked on the job
- Edit or delete work log entries

**Access:** Open any request from /requests → Scroll to "Work Hours Log" section

### 4. Deliveries Management Page
New dedicated page to view all deliveries across all job cards:
- **URL:** `/deliveries`
- **Navigation:** Sidebar → Deliveries
- **Features:**
  - Stats dashboard (Total, Pending, In Transit, Delivered, Cancelled)
  - Filter by status
  - Add new delivery notes
  - Edit existing deliveries
  - View which job card each delivery is assigned to
  - Search and track deliveries

## Data Structure

### Delivery Notes Table
```sql
delivery_notes (
  id                UUID PRIMARY KEY
  request_id        UUID NOT NULL
  request_type      VARCHAR(50)  -- 'wheelchair', 'g24', 'diving_solution', 'turney_seat'
  delivery_date     TIMESTAMP
  delivery_status   VARCHAR(50)  -- 'pending', 'in_transit', 'delivered', 'cancelled'
  tracking_number   VARCHAR(100)
  notes             TEXT
  recipient_name    VARCHAR(255)
  recipient_contact VARCHAR(100)
  delivery_address  TEXT
  created_by        VARCHAR(255)
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
)
```

### Work Hours Log Table
```sql
work_hours_log (
  id                UUID PRIMARY KEY
  request_id        UUID NOT NULL
  request_type      VARCHAR(50)  -- 'wheelchair', 'g24', 'diving_solution', 'turney_seat'
  employee_name     VARCHAR(255) NOT NULL
  hours_worked      DECIMAL(5,2) NOT NULL  -- e.g., 8.5 hours
  work_date         DATE NOT NULL
  task_description  TEXT
  notes             TEXT
  created_by        VARCHAR(255)
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
)
```

## File Changes Summary

### New Files
- `DELIVERY_WORK_HOURS_SCHEMA.sql` - Database schema
- `src/pages/Deliveries.jsx` - Deliveries management page
- `src/components/DeliveryWorkSection.jsx` - Delivery & work hours component for job cards
- `src/assets/machine.png` - Machine image for login page
- `src/assets/Cover.png` - Additional assets

### Modified Files
- `src/pages/Login.jsx` - Modern 50/50 split layout
- `src/pages/RequestDetails.jsx` - Added DeliveryWorkSection component
- `src/pages/RequestJobs.jsx` - Added Deliveries link to sidebar
- `src/App.jsx` - Added /deliveries route

## Testing Checklist

After deploying to Vercel and running the SQL:

- [ ] Login page displays with machine image on left, form on right
- [ ] Navigate to any request and see "Delivery Notes" section
- [ ] Add a delivery note and verify it saves
- [ ] Navigate to any request and see "Work Hours Log" section
- [ ] Log work hours and verify it saves
- [ ] Navigate to /deliveries page
- [ ] View all deliveries in the table
- [ ] Filter deliveries by status
- [ ] Add a new delivery from the Deliveries page
- [ ] Edit an existing delivery
- [ ] Verify total hours calculation on job cards

## Deployment Notes

1. **Supabase:** Run DELIVERY_WORK_HOURS_SCHEMA.sql first
2. **Vercel:** Push changes to GitHub (already done)
3. **Automatic Deployment:** Vercel will auto-deploy from main branch
4. **Verify:** Check that all environment variables are set in Vercel:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY

## Support

If you encounter issues:
1. Check Supabase SQL Editor for errors when running the schema
2. Verify both tables exist in Table Editor
3. Check browser console for any errors
4. Ensure RLS policies are enabled on both tables

---

**Status:** ✅ All changes committed and pushed to GitHub
**Next Step:** Run DELIVERY_WORK_HOURS_SCHEMA.sql in Supabase
