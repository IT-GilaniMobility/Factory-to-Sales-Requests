# Quick Start: Customer Measurements Form

## For Salespersons

### Sending Measurements Form to Customer
1. Open your job form
2. (Optional) Enter customer name
3. Click **"Get Customer Measurements"** button (green, below the PDF button)
4. A modal pops up with a link
5. Click **"Copy Link"** button
6. Send the link to customer via WhatsApp/Email/SMS

---

## For Customers

### Filling the Measurements Form
1. Click the link sent by salesperson
2. Enter your **full name**
3. Enter your **vehicle information** (Make, Model, Year)
4. Enter your **vehicle measurements** in millimeters:
   - A, B, C, D, H, Floor-to-Ground (at least one required)
5. Click **"Submit Measurements"**
6. Done! ✅

---

## For Salespersons (After Customer Submits)

### Using Customer's Submitted Data
1. Open your job form
2. Type in the **customer name** (same spelling they used)
3. System automatically fills in:
   - ✅ Vehicle Make/Model/Year
   - ✅ All measurements (A, B, C, D, H, Floor-to-Ground)
4. Review and edit if needed
5. Continue with full job form
6. Generate PDF and submit

---

## What Data is Collected

| Field | Type | Required |
|-------|------|----------|
| Customer Name | Text | ✅ Yes |
| Vehicle Make | Text | ✅ Yes |
| Vehicle Model | Text | ✅ Yes |
| Vehicle Year | Number | ✅ Yes |
| Measurement A | Number (mm) | ⭕ At least 1 |
| Measurement B | Number (mm) | ⭕ At least 1 |
| Measurement C | Number (mm) | ⭕ At least 1 |
| Measurement D | Number (mm) | ⭕ At least 1 |
| Measurement H | Number (mm) | ⭕ At least 1 |
| Floor to Ground | Number (mm) | ⭕ At least 1 |

---

## Example Link
```
https://your-app.com/customer-measurements/ABC123XYZ789
```

**Each customer gets a unique link!**

---

## Troubleshooting

**Q: Customer says "Link not found"**  
A: Link has expired or is incorrect. Generate a new one by clicking "Get Customer Measurements" again.

**Q: I filled in customer name but measurements didn't auto-fill**  
A: Make sure you spelled the name **exactly** the same as the customer did (spaces, capitalization matter).

**Q: I want to edit customer's measurements**  
A: For now, you can manually edit them in the form. Future version will allow direct editing.

**Q: Can I use this for multiple customers with same name?**  
A: It will load the **most recent** submission for that name. For duplicates, add middle initials or phone number to make names unique.

---

## Database Location
- Table: `customer_measurements`
- Access: Supabase Dashboard → SQL Editor
- Query: `SELECT * FROM customer_measurements WHERE is_submitted = true`

