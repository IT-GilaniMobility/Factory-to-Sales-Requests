# Customer Measurements Form - Google Login Setup

## What Changed

✅ Customers now **MUST** log in with Google before filling the vehicle measurements form
✅ Customer email is automatically captured and stored
✅ Form shows "Sign in with Google" button on the public link
✅ After login, customers see the form with their name and email

---

## How It Works

### **For Customers:**

1. **Receive link from salesperson**
   ```
   https://your-app.com/customer-measurements/ABC123XYZ789
   ```

2. **Click link → See Google login**
   - Shows professional login screen
   - Option to "Sign in with Google"

3. **Sign in with Google**
   - Uses their Google account (Gmail, Google account, etc.)
   - No password needed - uses Google authentication

4. **Fill form**
   - Form auto-populates their name from Google
   - They fill vehicle info + measurements
   - Click Submit

5. **Data saved**
   - Name ✅
   - Email ✅ (from Google account)
   - Vehicle info ✅
   - Measurements ✅

---

## Database Changes

### New Column: `customer_email`
Added to `customer_measurements` table to store:
- Customer's Google email address
- Used to identify who submitted the form
- Can be used to follow up with customer

```sql
ALTER TABLE customer_measurements
ADD COLUMN IF NOT EXISTS customer_email TEXT;
```

### Run the Migration
Execute this in Supabase SQL Editor:
```sql
-- This adds the customer_email column if it doesn't exist
ALTER TABLE customer_measurements
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_measurements_customer_email ON customer_measurements(customer_email);
```

---

## User Flow Diagram

```
Customer opens link
       ↓
   Loading screen
       ↓
Google login page (if not logged in)
       ↓
Click "Sign in with Google"
       ↓
Google authentication
       ↓
Redirected back to form
       ↓
Form shows (with user info)
       ↓
Fill measurements
       ↓
Click Submit
       ↓
Data saved with customer_email
```

---

## For Salespersons

**No changes needed!** The workflow is the same:
1. Click "Get Customer Measurements"
2. Send link to customer
3. Customer now needs to log in with Google (added security)
4. Data comes back with their email automatically

---

## Benefits

✅ **Security** - Only authenticated users can fill forms  
✅ **Verification** - Know exactly who submitted data (email verification)  
✅ **Compliance** - Follow-up emails possible  
✅ **User-friendly** - No passwords, uses Google account  
✅ **Auto-population** - Name/email from Google account  

---

## Sample Data in Database

After customer submits, you'll see in Supabase:

| Field | Value |
|-------|-------|
| measurements_token | ABC123XYZ789 |
| customer_name | Ahmed Al-Mansouri |
| customer_email | ahmed@example.com |
| vehicle_make | Toyota |
| vehicle_model | Land Cruiser |
| vehicle_year | 2023 |
| measure_a | 1200 |
| is_submitted | true |
| submitted_at | 2026-01-12 14:30:00 |
| payload | {submittedByEmail: "ahmed@example.com", ...} |

---

## Testing the Feature

### Step 1: Generate Link
- Open salesperson form
- Click "Get Customer Measurements"
- Copy the link

### Step 2: Test as Customer (Incognito)
- Open new incognito window
- Paste the link
- Should see "Sign in with Google" button
- Click it
- Go through Google login
- Fill form and submit

### Step 3: Verify Data
- Go to Supabase
- Check `customer_measurements` table
- Verify `customer_email` is populated

---

## Troubleshooting

**Q: Customer says "Sign in with Google" button doesn't work**  
A: Check if Google OAuth is properly configured in Supabase settings

**Q: Email is not being saved**  
A: Make sure you ran the migration SQL to add `customer_email` column

**Q: Customer got signed out**  
A: Session timeout - they'll need to click link again to re-authenticate

**Q: Wrong user logged in**  
A: Customer should sign out from Google account first, then try again

---

## Security Notes

✅ Only authenticated Google users can access the form  
✅ Customer email is captured (no privacy issues if stated in T&C)  
✅ Link is still token-based (each customer gets unique link)  
✅ Supabase handles Google OAuth securely  

