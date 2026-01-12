# Customer Form Access Control & Workflow

## Security Overview

### External Users (Customers) Access
✅ **Can Access:**
- `/customer-form-public/:token` - Public customer form ONLY
- Requires Google authentication (via public OAuth)
- No access to admin dashboard, request management, or any other pages

❌ **Cannot Access:**
- `/requests` - Request Management Dashboard
- `/customer` - New Request Form (Admin)
- `/deliveries` - Delivery Management
- `/work-hours` - Work Hours Tracking
- `/logs` - Activity Logs
- Any other admin/internal pages

### How It Works

1. **Admin Generates Link**
   - Admin clicks green "Customer Form Link" button in sidebar
   - System creates unique token and form record in database
   - Admin copies link and sends to customer

2. **Customer Opens Link**
   - Customer opens `https://yourapp.com/customer-form-public/XXXXXXXXXX`
   - Page loads (no authentication required initially)
   - Customer sees "Login with Google" button

3. **Customer Authenticates**
   - Customer clicks "Login with Google"
   - Google OAuth authenticates (must be set to "External" in Google Cloud Console)
   - Customer is redirected back to the form
   - **Customer can ONLY access this specific form - nothing else**

4. **Customer Fills Form**
   - Customer Name, Mobile, Address
   - Vehicle Make, Model, Year
   - User Measurements (weight, wheelchair info, dimensions)
   - Vehicle Measurements
   - Signature on canvas

5. **Customer Submits**
   - Form data saved to `customer_forms_public` table
   - Signature saved as base64 data URL
   - Form marked as submitted

6. **Admin Views Submissions**
   - Admin sees submitted forms in sidebar "Customer Forms" section
   - Shows count badge with number of submissions
   - "New" badge for unconverted forms

7. **Admin Creates Request from Form**
   - Admin clicks on submitted form in sidebar
   - Navigates to `/customer` (New Request form)
   - **All customer data is automatically pre-filled**:
     - Customer Name
     - Mobile
     - Address
     - Vehicle Make/Model/Year
     - All Measurements (A, B, C, D, H, Floor to Ground)
     - User Weight, Wheelchair Weight, Type, Situation
   - Admin completes remaining fields and submits

## Database Tables

### customer_forms_public
- Stores all customer form submissions
- Fields include all customer info, vehicle info, measurements, signature
- Has `converted_to_request_id` to track if form was converted to actual request
- Has `generated_by_email` to track which admin created the link

### Linking
- When admin submits the request, can optionally link back to source customer form
- Future enhancement: Auto-mark form as converted when request is created

## Google OAuth Configuration

**IMPORTANT:** For external customers to log in:

1. Go to Google Cloud Console → OAuth consent screen
2. Change User Type from "Internal" to **"External"**
3. Either:
   - Keep in "Testing" mode and add specific test users
   - OR "Publish App" to allow any Google user

## Routes

### Public Routes (No Auth Required)
```javascript
/customer-form-public/:token  // Customer form - requires Google login after opening
```

### Protected Routes (Auth Required)
```javascript
/requests        // Admin dashboard
/customer        // New request form (can receive prefill data)
/deliveries      // Delivery management
/work-hours      // Work hours tracking
/logs            // Activity logs
```

## Implementation Summary

✅ Green "Customer Form Link" button in admin sidebar
✅ Modal to show and copy generated link
✅ Customer form with Google OAuth requirement
✅ Signature canvas for customer signature
✅ Sidebar section showing submitted forms
✅ Auto-prefill New Request form when clicking submitted form
✅ Security: External users can ONLY access customer form, not dashboard

## Next Steps (Optional Enhancements)

- [ ] Add email notification when customer submits form
- [ ] Auto-mark customer form as "converted" when request is created
- [ ] Add ability to view/download customer signature in admin view
- [ ] Add form expiration (e.g., link valid for 30 days)
- [ ] Add ability to resend form link to customer
- [ ] Add notes field for admin when generating link
