# PDF & Customer Form Feature - Setup Guide

## Overview
This feature allows sales personnel to:
1. Generate PDF documents from completed forms
2. Share unique links with customers
3. Customers can upload vehicle photos without logging in
4. Track customer submissions in the dashboard

---

## 🗄️ DATABASE SETUP

### Step 1: Run SQL Schema
Execute the SQL commands in `PDF_CUSTOMER_FORM_SCHEMA.sql` in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy and paste the contents of PDF_CUSTOMER_FORM_SCHEMA.sql
# Click "Run" to execute
```

This will:
- Add new columns to all request tables (requests, g24_requests, diving_solution_requests, turney_seat_requests)
- Create indexes for faster lookups
- Set up storage policies

### Step 2: Create Storage Buckets in Supabase

#### Bucket 1: request-pdfs (Private)
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `request-pdfs`
4. Public: **NO** (keep private)
5. File size limit: 10MB
6. Allowed MIME types: `application/pdf`

#### Bucket 2: vehicle-photos (Public)
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `vehicle-photos`
4. Public: **YES** (allow public access)
5. File size limit: 5MB per file
6. Allowed MIME types: `image/jpeg, image/png, image/webp`

### Step 3: Apply Storage Policies

The SQL file includes storage policies. If they don't auto-apply, manually create them:

**For request-pdfs bucket:**
- Allow authenticated users to upload PDFs
- Allow authenticated users to read PDFs
- Allow public read access (via signed URLs)

**For vehicle-photos bucket:**
- Allow public upload
- Allow public read

---

## 📦 INSTALLED PACKAGES

The following packages were automatically installed:
- `jspdf` - PDF generation library
- `html2canvas` - Convert HTML to canvas for PDF

These are already in your `package.json`.

---

## 📁 NEW FILES CREATED

### 1. **src/utils/pdfService.js**
Handles all PDF-related operations:
- `generatePDFFromElement()` - Converts HTML to PDF
- `uploadPDFToStorage()` - Uploads PDF to Supabase Storage
- `uploadVehiclePhoto()` - Handles customer photo uploads
- `generateAndUploadPDF()` - Complete PDF generation flow
- `updateRequestWithPDF()` - Updates database with PDF URL and token
- `generateToken()` - Creates unique customer form tokens
- `getCustomerFormURL()` - Generates shareable customer link

### 2. **src/components/PDFGenerator.jsx**
React component that renders form data as printable PDF:
- Displays all form sections
- Formats measurements and data
- Handles all job types (Wheelchair, G24, Diving, Turney)
- Supports forward ref for PDF generation

### 3. **src/pages/CustomerForm.jsx**
Public page for customers (no login required):
- Displays PDF preview of sales person's form
- Allows photo uploads
- Collects additional customer notes
- Submits data back to database
- Shows success confirmation

### 4. **PDF_CUSTOMER_FORM_SCHEMA.sql**
Complete database schema with all SQL commands needed

---

## 🔄 MODIFIED FILES

### 1. **src/pages/Customer.jsx**
**Added:**
- PDF generation state variables (`pdfUrl`, `isGeneratingPDF`, `customerToken`)
- `handleGeneratePDF()` function - Validates form and generates PDF
- `handleCopyLink()` function - Copies customer link to clipboard
- "Generate PDF" button in footer (must be clicked before submit)
- "Submit Request" button now requires PDF (disabled if no PDF)
- Hidden `<PDFGenerator>` component for rendering
- Share modal that appears after successful submission with customer link
- PDF status indicators (green checkmark when ready)
- All database inserts now include `pdf_url` and `pdf_generated_at`
- Customer token generation after successful submission

### 2. **src/pages/RequestJobs.jsx**
**Added:**
- Import `FiFileText` and `FiCheck` icons
- PDF and Customer Submission badges on job cards
- Badge shows "PDF" icon if PDF is generated
- Badge shows "Customer Submitted" with checkmark if customer completed their part
- All data mappings include new PDF and customer fields

### 3. **src/App.jsx**
**Added:**
- Import for `CustomerForm` component
- Public route `/customer-form/:token` (accessible without login)
- Route added to both logged-in and logged-out Router configurations

---

## 🎯 HOW IT WORKS

### Sales Person Workflow:

1. **Fill Form**
   - Sales person logs in
   - Goes to "Create New Request"
   - Fills all required form fields

2. **Generate PDF** (Required Step)
   - Click "Generate PDF" button in footer
   - System validates all fields
   - PDF is generated from form data
   - PDF uploaded to Supabase Storage (`request-pdfs` bucket)
   - Button turns green with checkmark

3. **Submit Request**
   - "Submit Request" button only enabled after PDF generated
   - On submit:
     - Request saved to database with PDF URL
     - Unique customer token generated (e.g., `ABC123XYZ456`)
     - Share modal appears automatically

4. **Share with Customer**
   - Modal shows customer link: `https://yourapp.com/customer-form/ABC123XYZ456`
   - Click "Copy Link" button
   - Share link via SMS, Email, WhatsApp, etc.

### Customer Workflow:

1. **Open Link**
   - Customer receives link from sales person
   - Opens in any browser (no login needed)
   - Sees PDF preview of sales person's form

2. **Review Details**
   - Customer reviews all information
   - Sees their name, vehicle details, etc.
   - Can open PDF in new tab

3. **Upload Photos**
   - Customer uploads vehicle photos:
     - Exterior views
     - Interior shots
     - Installation areas
     - VIN plate, etc.
   - Photos stored in `vehicle-photos` bucket

4. **Add Notes** (Optional)
   - Customer can add additional information
   - Special requests or concerns

5. **Submit**
   - Click "Submit Information"
   - Data saved to database:
     - `customer_vehicle_photos` array with image URLs
     - `customer_notes` text
     - `customer_submitted` set to `true`
     - `customer_submitted_at` timestamp
   - Success message displayed

### Factory/Sales Dashboard:

1. **Job Cards Show Status**
   - Purple "PDF" badge if PDF generated
   - Green "Customer Submitted" badge if customer completed their part

2. **Click to View Details**
   - See full request details
   - View customer-uploaded photos
   - Read customer notes
   - Access PDF document

---

## 🚀 TESTING INSTRUCTIONS

### Test 1: Generate PDF
1. Login as sales person
2. Go to "Create New Request"
3. Fill minimal required fields
4. Click "Generate PDF"
5. Check:
   - ✅ Button shows loading state
   - ✅ PDF generates successfully
   - ✅ Button turns green with checkmark
   - ✅ "Submit Request" button becomes enabled

### Test 2: Submit with PDF
1. After generating PDF
2. Click "Submit Request"
3. Check:
   - ✅ Share modal appears
   - ✅ Customer link displayed
   - ✅ Copy button works
   - ✅ Request appears in dashboard with PDF badge

### Test 3: Customer Form Access
1. Copy customer link from share modal
2. Open in incognito/private browser window (or logout first)
3. Check:
   - ✅ Page loads without login prompt
   - ✅ PDF preview displays correctly
   - ✅ Customer information shown

### Test 4: Customer Photo Upload
1. On customer form, click "Upload Photos"
2. Select 2-3 vehicle images
3. Check:
   - ✅ Upload progress shown
   - ✅ Images display in grid
   - ✅ Can remove images with X button
   - ✅ Submit button enables after upload

### Test 5: Customer Submission
1. Upload at least one photo
2. Add optional notes
3. Click "Submit Information"
4. Check:
   - ✅ Success message appears
   - ✅ Can't submit again (already submitted message)

### Test 6: Dashboard Update
1. Go back to sales/factory dashboard
2. Find the submitted request
3. Check:
   - ✅ "Customer Submitted" green badge appears
   - ✅ Click to view details
   - ✅ Customer photos visible
   - ✅ Customer notes displayed

---

## 🔧 TROUBLESHOOTING

### PDF Generation Fails
**Problem:** "Failed to generate PDF" error
**Solutions:**
- Check browser console for errors
- Verify `request-pdfs` bucket exists in Supabase
- Confirm storage policies are applied
- Check SUPABASE_URL and SUPABASE_ANON_KEY in .env

### Customer Can't Access Link
**Problem:** "Request not found or link has expired"
**Solutions:**
- Verify token exists in database
- Check `customer_form_token` column is populated
- Confirm request was submitted successfully
- Try generating new PDF and resubmitting

### Photos Won't Upload
**Problem:** Customer can't upload photos
**Solutions:**
- Verify `vehicle-photos` bucket exists
- Confirm bucket is set to PUBLIC
- Check storage policies allow public upload
- Verify file size under 5MB
- Confirm file type is image (jpeg/png/webp)

### PDF Not Showing in Dashboard
**Problem:** PDF badge not appearing on job cards
**Solutions:**
- Check `pdf_url` column in database
- Verify file was uploaded to storage
- Refresh dashboard page
- Check browser console for errors

### Submit Button Disabled
**Problem:** Can't submit request
**Solutions:**
- Must click "Generate PDF" first
- Check all required fields filled
- Look for validation error messages
- Generate PDF again if needed

---

## 🎨 UI/UX FEATURES

### Sales Person View:
- **Footer Buttons:**
  - Reset (gray)
  - Generate PDF (purple → green when complete)
  - Submit Request (blue, disabled until PDF ready)
  
- **PDF Status:**
  - Green checkmark with "PDF Generated" text
  - Error messages if generation fails

- **Share Modal:**
  - Large, centered modal
  - Copy link button
  - Link displayed in monospace font
  - "Copied!" confirmation feedback

### Customer View:
- **Clean, Modern Design:**
  - No navigation bars (standalone page)
  - Large, clear sections
  - Mobile-responsive layout

- **PDF Iframe:**
  - Embedded PDF viewer
  - "Open in new tab" link

- **Photo Upload:**
  - Drag-and-drop friendly
  - Grid display of uploaded images
  - Hover to remove images
  - Upload progress indicator

- **Submit Button:**
  - Large, green, prominent
  - Disabled until photos uploaded
  - Loading state during submission

- **Success Screen:**
  - Large checkmark icon
  - Thank you message
  - Confirmation text

---

## 📊 DATABASE COLUMNS ADDED

All four tables now have these columns:

| Column | Type | Description |
|--------|------|-------------|
| `pdf_url` | TEXT | Public URL of generated PDF |
| `pdf_generated_at` | TIMESTAMP | When PDF was created |
| `customer_form_token` | TEXT (UNIQUE) | Unique token for customer link |
| `customer_submitted` | BOOLEAN | Whether customer completed their part |
| `customer_submitted_at` | TIMESTAMP | When customer submitted |
| `customer_vehicle_photos` | TEXT[] | Array of photo URLs |
| `customer_notes` | TEXT | Customer's additional comments |
| `customer_filled_data` | JSONB | Future use for additional customer data |

---

## 🔐 SECURITY NOTES

### PDF Storage (request-pdfs bucket):
- **Private bucket** - not publicly accessible
- PDFs accessed via signed URLs only
- Authenticated users can upload
- Sales/Factory can view all PDFs

### Photo Storage (vehicle-photos bucket):
- **Public bucket** - allows unauthenticated uploads
- Anyone with link can view photos
- Consider adding file name randomization
- Monitor for abuse/spam uploads

### Customer Form Access:
- Uses unique tokens (12 characters, alphanumeric)
- No authentication required (by design)
- Tokens are one-time use conceptually
- Once submitted, form shows "already submitted" message
- Consider adding token expiration in future

---

## 🚧 FUTURE ENHANCEMENTS

Possible improvements:
1. **Email Notifications**
   - Auto-email customer when link generated
   - Notify sales person when customer submits
   
2. **Token Expiration**
   - Add expiry date to tokens
   - Require regeneration after X days

3. **Photo Compression**
   - Compress images before upload
   - Reduce storage costs

4. **PDF Versioning**
   - Keep history of PDF versions
   - Track changes/revisions

5. **Customer Signature**
   - Add signature capture to customer form
   - Legal acknowledgment

6. **SMS Integration**
   - Send link via SMS automatically
   - Track link opens

7. **Analytics**
   - Track link clicks
   - Time to completion
   - Photo upload stats

---

## ✅ CHECKLIST

Before going live:
- [ ] Run SQL schema in Supabase
- [ ] Create `request-pdfs` bucket (private)
- [ ] Create `vehicle-photos` bucket (public)
- [ ] Apply storage policies
- [ ] Test PDF generation
- [ ] Test customer form access (no login)
- [ ] Test photo uploads
- [ ] Test customer submission
- [ ] Verify dashboard badges appear
- [ ] Test on mobile devices
- [ ] Share test link with real customer

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase buckets exist
3. Confirm storage policies applied
4. Review database columns added
5. Test with different browsers
6. Check file sizes and types

All components are built and ready to use! 🎉
