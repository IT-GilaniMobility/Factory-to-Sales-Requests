# Storage Bucket Setup - Step by Step

## STEP 1: Create the Storage Bucket

### In Supabase Dashboard:

1. Click **Storage** in the left sidebar
2. Click **Create a new bucket** button
3. In the dialog:
   - **Bucket name:** `request-attachments`
   - **Visibility:** Make sure **"Private bucket"** checkbox is UNCHECKED ✓
   - Click **Create bucket**

### Expected Result:
You should see "request-attachments" in your storage bucket list

---

## STEP 2: Add Storage Access Policies

### In Supabase Dashboard:

1. Click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste the following SQL code:

```sql
-- Policy 1: Allow public read access to all files in request-attachments
DROP POLICY IF EXISTS "Allow public read request-attachments" ON storage.objects;
CREATE POLICY "Allow public read request-attachments" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'request-attachments');

-- Policy 2: Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated upload request-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated upload request-attachments" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to delete files
DROP POLICY IF EXISTS "Allow authenticated delete request-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated delete request-attachments" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );

-- Policy 4: Allow authenticated users to update file metadata
DROP POLICY IF EXISTS "Allow authenticated update request-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated update request-attachments" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );
```

4. Click **Run** (or press Ctrl+Enter)

### Expected Result:
You should see green checkmarks and "Query executed successfully" message

---

## STEP 3: Verify the Setup

### In Supabase Dashboard SQL Editor:

1. Create a **New query**
2. Paste this verification query:

```sql
SELECT 
  name, 
  id, 
  public,
  created_at
FROM storage.buckets 
WHERE name = 'request-attachments';
```

3. Click **Run**

### Expected Result:
You should see one row with:
- **name:** request-attachments
- **public:** true
- **created_at:** (current timestamp)

If you don't see any results, the bucket wasn't created yet. Go back to STEP 1.

---

## STEP 4: Test in the Application

1. **Open the app** in your browser (http://localhost:3000)
2. **Navigate to a job request form** (Wheelchair Lifter, G24, Diving, or Turney)
3. **Scroll to the attachment section** (before signature section)
4. Click **"Upload Files (PDF, Images, Documents)"** button
5. **Select a file** from your computer (any PDF, image, Word doc, etc.)
6. **Wait for upload** (should complete in 2-5 seconds)

### Expected Result:
- File appears in "Attached Files" list below
- Shows file icon: 📄 for PDF, 🖼️ for images, 📝 for Word, etc.
- Shows filename and file size in KB
- "View" button opens file in new tab
- "Remove" button deletes file from storage

If you see an error like "Bucket not found", go back to STEP 1.

---

## STEP 5: Test File Operations

### Test View Link:
1. In the Attached Files list, click **View** next to a file
2. File should open in a new tab

### Test Delete:
1. In the Attached Files list, click **Remove** next to a file
2. File should disappear from the list
3. In Supabase Storage, file should be deleted

### Test Submission:
1. Fill out the entire job request form
2. Upload an attachment
3. Sign the form
4. Click **Submit Request**
5. In RequestDetails page, scroll to attachments section
6. File should still be there with View link working

---

## TROUBLESHOOTING

### Issue: "Bucket not found" error when uploading

**Solution:**
1. Make sure you completed STEP 1
2. Verify bucket exists in Supabase Dashboard → Storage
3. Double-check bucket name is exactly: `request-attachments`
4. Make sure bucket is PUBLIC (not private)

### Issue: "Permission denied" error when uploading

**Solution:**
1. Make sure you completed STEP 2
2. Run the SQL policies again
3. Try reloading the app (Ctrl+R or Cmd+R)
4. Check browser console for detailed error

### Issue: File uploads but disappears after refresh

**Solution:**
This is normal - the attachment is stored in the request record in the database. The file persists in Supabase Storage. Refresh should still show it if the submission was successful.

### Issue: Can't see the attachment section in the form

**Solution:**
1. Make sure you're on a job request form (not customer form)
2. Scroll down - attachment section is before the signature
3. Make sure your job type is selected (Wheelchair, G24, Diving, or Turney)

---

## QUICK REFERENCE

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create bucket | Bucket appears in Storage list |
| 2 | Add policies | SQL runs without errors |
| 3 | Verify bucket | SELECT query returns 1 row |
| 4 | Test upload | File appears in attachment list |
| 5 | Test view | File opens in new tab |
| 5 | Test delete | File disappears from list |

---

## NEXT STEPS

Once setup is complete:

1. ✅ Users can upload files to job requests
2. ✅ Files appear with type icons
3. ✅ Files persist with the job request
4. ✅ Admin can view files in dashboard
5. ✅ Files can be viewed and deleted

---

## SUPPORT

For help:
1. Check TROUBLESHOOTING section above
2. Review STORAGE_SETUP_GUIDE.md for detailed info
3. Check browser console (F12 → Console tab) for error details
4. Check Supabase dashboard for bucket status
