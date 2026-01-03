# Turney Seat Installation Form Implementation

## Overview
A complete Turney Seat Installation form has been added to the Workrequest Demo application with full form validation, data persistence to Supabase, and a dedicated preview/details page.

## Files Modified

### 1. **src/pages/Customer.jsx**
- ✅ Added imports for `manHeight`, `womenHeight`, and `turneySeat` images
- ✅ Extended `initialState` with Turney Seat fields:
  - `userHeight1`, `userHeight2`
  - `misuaA`, `misuaB`, `misuaC`, `misuaD`, `misuaE`
  - `seatBaseMeasurement`, `seatBracketMeasurement`
  - `specialRequest`, `productLocation`, `optionalExtraAddOns`
- ✅ Added "Turney Seat Installation" option to job request dropdown
- ✅ Created complete Turney Seat form sections:
  - **Section 2**: Vehicle Description (Make, Model, Year)
  - **Section 3**: User Information (Weight, Heights with visual overlays on man/woman height images)
  - **Section 4**: Vehicle Measurements (Misure A-E with interactive image labels)
  - **Section 5**: Product & Configuration (Product, Special Request, Extra Add-ons, Location)
  - **Section 6**: Training Acknowledgement (checklist style)
  - **Section 7**: Customer Signature
- ✅ Updated validation logic for Turney Seat fields
- ✅ Updated payload to include `turneySeat` object
- ✅ Added Supabase insert to `turney_seat_requests` table with field mapping

### 2. **src/pages/RequestDetails.jsx**
- ✅ Added imports for `manHeight`, `womenHeight`, and `turneySeat` images
- ✅ Created **TurneyLayout** component for Turney Seat preview with:
  - Customer & Vehicle section
  - User Information with height images and overlay data
  - Vehicle Measurements with interactive image showing all Misure values positioned correctly:
    - Misura A: Top left
    - Misura B: Top middle
    - Misura C: Right middle
    - Misura D: Right bottom middle
    - Misura E: Bottom right
  - Product & Configuration section
  - Training Acknowledgement section
  - Signature display
- ✅ Updated `normalizeRequest()` to include `turneySeat` data
- ✅ Added `turney_seat_requests` to Supabase table lookup
- ✅ Added `isTurney` flag and conditional rendering
- ✅ Updated `handleStatusChange()` to support Turney Seat table
- ✅ Updated factory summary to include Turney Seat data

### 3. **src/pages/RequestJobs.jsx**
- ✅ Updated Supabase fetch to include `turney_seat_requests` table
- ✅ Added mapping logic for Turney Seat requests with proper job type labeling
- ✅ Integrated Turney Seat requests into the main request list

### 4. **DATABASE_SCHEMA.sql**
- ✅ Added complete **turney_seat_requests** table schema with:
  - UUID primary key and request_code unique constraint
  - Customer information fields (name, mobile, address, quote_ref)
  - Vehicle information fields (make, model, year)
  - User information fields (weight, heights, situation)
  - Vehicle measurements (all Misure fields A-E, seat base/bracket measurements)
  - Product configuration fields (model, special request, add-ons, location)
  - Full JSONB payload for flexibility
  - Indexed columns for efficient queries (request_code, customer_mobile, quote_ref, created_at)

## Form Structure Details

### Section 3: User Information Layout
```
Left Column                          Right Column
├─ User Weight (kg)                 ├─ Man Height Image
├─ User Height 1 (cm)               │  ├─ Height 1 overlay on right
├─ User Height 2 (cm)               │  
├─ User Situation                    ├─ Woman Height Image
                                      ├─ Height 2 overlay on left
```

### Section 4: Vehicle Measurements Layout
```
Left Column                          Right Column
├─ Misura A (Min. 970mm)            ├─ Turney Seat Image (Center)
├─ Misura B (Min. 950mm)            │  ├─ A: Top left
├─ Misura C (Min. 620mm)            │  ├─ B: Top middle
├─ Misura D (Min. 620mm)            │  ├─ C: Right middle
├─ Misura E (Min. 400mm)            │  ├─ D: Right bottom middle
├─ Seat Base to Roof                │  ├─ E: Bottom right
├─ Seat Bracket to Roof             │
```

## Data Flow

### Form Submission
1. User fills in Turney Seat Installation form with validation
2. Form data is structured in payload with customer, job, turneySeat objects
3. Data persists to **turney_seat_requests** Supabase table
4. Backup copy saved to localStorage as fallback

### Data Retrieval (Request Details & List)
1. RequestJobs fetches from `turney_seat_requests` table
2. Data normalized into consistent request object format
3. Request preview rendered using **TurneyLayout** component
4. All measurements and images display with data overlays

## Validation Rules
- **Required Fields**:
  - Customer: Name, Mobile, Address, Quote Ref
  - Vehicle: Make, Model, Year
  - User: Weight, Height 1, Height 2, Situation
  - Measurements: Misure A, B, C, D, E
  - Product: Product name, Product Location
  - Signature: Must be drawn on canvas
  
- **Optional Fields**:
  - Seat Base to Roof measurement
  - Seat Bracket to Roof measurement
  - Special Request (seat colour, etc.)
  - Optional Extra Add-ons

## Database Setup
Run this SQL in your Supabase SQL Editor to create the Turney Seat table:

```sql
CREATE TABLE IF NOT EXISTS turney_seat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Requested to factory',
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quote_ref TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  
  -- User Information
  user_weight FLOAT,
  user_height_1 FLOAT,
  user_height_2 FLOAT,
  user_situation TEXT,
  
  -- Vehicle Measurements (Misure)
  misua_a FLOAT,
  misua_b FLOAT,
  misua_c FLOAT,
  misua_d FLOAT,
  misua_e FLOAT,
  seat_base_measurement FLOAT,
  seat_bracket_measurement FLOAT,
  
  -- Product Configuration
  product_model TEXT,
  special_request TEXT,
  optional_extra_add_ons TEXT,
  product_location TEXT,
  
  -- Full payload as JSON for flexibility
  payload JSONB NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_turney_request_code ON turney_seat_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_turney_customer_mobile ON turney_seat_requests(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_turney_quote_ref ON turney_seat_requests(quote_ref);
CREATE INDEX IF NOT EXISTS idx_turney_created_at ON turney_seat_requests(created_at DESC);
```

## Testing Steps

1. **Create a Turney Seat Request**:
   - Navigate to the form
   - Select "Turney Seat Installation" from job dropdown
   - Fill in all required fields
   - Submit form

2. **View Request Details**:
   - Go to Requests page
   - Click on Turney Seat request
   - Verify all data displays correctly with images and overlays

3. **Verify Preview**:
   - Check that man/woman height images show with data overlays
   - Check that turney-seat.png displays with all Misure labels positioned correctly
   - Verify all product and configuration data displays

4. **Export Functionality**:
   - Test "Copy Factory Summary" button
   - Test "Download JSON" button
   - Test "Export PDF" button

## Asset Requirements
The following images must be present in `src/assets/`:
- ✅ `man-height.png` - Reference image for man height measurement
- ✅ `women-height.png` - Reference image for woman height measurement
- ✅ `turney-seat.png` - Turney seat measurement reference with labeled points
- ✅ `gm-header.png` - Company header logo

All assets are already present in the project.

## Status Management
Turney Seat requests support the same status workflow as other request types:
- Requested to factory
- In review
- Approved
- Completed

Status updates are persisted to both Supabase and localStorage.

## Notes
- All form sections are conditionally rendered based on completion of previous sections
- Data is auto-saved to localStorage as user types (500ms debounce)
- Complete form validation before submission
- Responsive design works on mobile and desktop
- All measurement overlays are positioned absolutely and scale with image
- Training section displays as read-only confirmation in preview
- Signature is stored as canvas image data URL
