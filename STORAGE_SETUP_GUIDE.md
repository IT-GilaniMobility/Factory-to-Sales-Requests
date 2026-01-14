# 🚀 Supabase Storage Bucket Setup - Quick Guide

## Problem
File uploads fail with: **"Bucket not found"**

## Solution
The `request-attachments` storage bucket needs to be created in Supabase.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Click **Storage** (left sidebar)
3. Click **Create a new bucket**
4. Enter name: `request-attachments`
5. **Important:** Uncheck "Private bucket" (make it PUBLIC)
6. Click **Create bucket**

✅ Bucket should now appear in your Storage list

### Step 2: Add Storage Policies

1. Go to **SQL Editor** in Supabase
2. Create a new query
3. Copy and paste all the `CREATE POLICY` statements from `STORAGE_BUCKET_SETUP.sql`
4. Click **Run**

Expected output: `Query executed successfully`

### Step 3: Verify Setup

Test in the app:

1. Go to the job request form
2. Click **"Upload Files (PDF, Images, Documents)"**
3. Select a file (PDF, image, Word doc, etc.)
4. File should upload successfully ✅

---

## 📋 Complete Steps

### Via Supabase Dashboard UI

**Create Bucket:**
- Storage → Create a new bucket
- Name: `request-attachments`
- Visibility: PUBLIC ✓
- Create

**Set Policies:**
- SQL Editor → New query
- Paste policies from STORAGE_BUCKET_SETUP.sql
- Run

**Test:**
- Open app
- Try uploading a file
- File should appear in attachment list with icon

---

## ✅ Verification Checklist

- [ ] Bucket exists: Supabase Storage shows "request-attachments"
- [ ] Bucket is PUBLIC: Can view files without authentication
- [ ] Policies are set: Can upload/delete files from the app
- [ ] File upload works: Successfully uploaded test PDF
- [ ] File appears in app: Attachment list shows the file
- [ ] File icon displays: Shows 📄 for PDF, 🖼️ for images, etc.
- [ ] View link works: Can click "View" to open file in new tab
- [ ] Delete works: Remove button deletes file from storage

---

## 🔍 Troubleshooting

### "Bucket not found" Error

**Cause:** Bucket doesn't exist yet
**Fix:** Go to Supabase Dashboard → Storage → Create new bucket with name `request-attachments`

### "Permission denied" on Upload

**Cause:** Storage policies not set
**Fix:** Run the SQL policies from STORAGE_BUCKET_SETUP.sql in SQL Editor

### File uploads but can't be viewed

**Cause:** Bucket is set to PRIVATE
**Fix:** Make sure bucket is PUBLIC (Step 1, uncheck "Private bucket")

### Can't delete files (Remove button doesn't work)

**Cause:** DELETE policy not created
**Fix:** Run all 4 CREATE POLICY statements, including the DELETE policy

---

## 📚 File Structure in Storage

After setup, files will be organized as:

```
request-attachments/
├── DRAFT-1705276800000_1705276800001.pdf
├── DRAFT-1705276820000_1705276820001.jpg
├── DRAFT-1705276840000_1705276840001.docx
└── (more files as users upload)
```

Each filename includes the request code and timestamp for uniqueness.

---

## 🌐 File Access URLs

After uploading, files are publicly accessible at:

```
https://YOUR_SUPABASE_PROJECT.supabase.co/storage/v1/object/public/request-attachments/{filename}
```

Example:
```
https://abc123def.supabase.co/storage/v1/object/public/request-attachments/DRAFT-1705276800000_1705276800001.pdf
```

---

## 💾 Database Integration

When files are uploaded, metadata is stored in the request tables:

```json
{
  "request_attachments": [
    {
      "filename": "Sara.pdf",
      "url": "https://..../request-attachments/DRAFT-...pdf",
      "uploadedAt": "2026-01-14T10:00:00.000Z",
      "size": 245670
    },
    {
      "filename": "specification.docx",
      "url": "https://..../request-attachments/DRAFT-...docx",
      "uploadedAt": "2026-01-14T10:01:00.000Z",
      "size": 89120
    }
  ]
}
```

---

## 🎯 What Works After Setup

✅ Upload multiple files (PDF, images, Word, Excel, CAD)
✅ View file type icons (📄 📝 📊 🖼️ 📐)
✅ Click "View" to open files in new tab
✅ Click "Remove" to delete files from storage
✅ Attachments persist with job requests
✅ Attachments visible in admin dashboard

---

## ⚠️ Important Notes

- **Bucket must be PUBLIC** for files to be viewable
- **Storage policies control who can upload/delete** (authenticated users only)
- **Files are permanent** until manually removed
- **No automatic cleanup** - deleted files must be removed individually
- **No file size limit** by default (depends on your Supabase plan)

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all steps in the Quick Setup section
3. Run the verification checklist
4. Check browser console for detailed error messages

---

## 🔗 Resources

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Supabase RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- SQL File: `STORAGE_BUCKET_SETUP.sql`
- App File: `ATTACHMENT_UPLOAD_SETUP.md`
