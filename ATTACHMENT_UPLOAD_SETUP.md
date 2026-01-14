# File Attachment Upload Setup

## Overview
The application now supports file attachments for job requests. Files are uploaded to a Supabase Storage bucket named `request-attachments`.

## Supabase Configuration Required

### 1. Create Storage Bucket (if not exists)

In Supabase Dashboard:
- Go to **Storage** section
- Click **Create a new bucket**
- Bucket name: `request-attachments`
- Public/Private: **Public** (so files can be viewed via URL)
- Click **Create bucket**

### 2. Set Bucket Policies

After creating the bucket, configure access policies:

#### Policy 1: Allow Public Read
```sql
-- Allow anyone to read files from request-attachments bucket
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'request-attachments');
```

#### Policy 2: Allow Authenticated Upload
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );
```

#### Policy 3: Allow Authenticated Delete
```sql
-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'request-attachments' AND 
    auth.role() = 'authenticated'
  );
```

### 3. Verify Bucket Setup

Test that the bucket is working:

```bash
# In browser console, test upload:
const { data, error } = await supabase.storage
  .from('request-attachments')
  .upload('test.txt', new Blob(['test'], { type: 'text/plain' }));

if (error) console.error('Upload failed:', error);
else console.log('Upload success:', data);
```

## Application Implementation

### File Upload Flow

1. **User selects files** via the attachment upload input
2. **handleAttachmentUpload()** processes each file:
   - Calls `uploadRequestAttachment(file, requestCode)`
   - Receives file metadata (filename, url, size, uploadedAt)
   - Adds to `formData.requestAttachments` array
   - Displays in attachment list with file type icon

3. **File display in list** shows:
   - 📄 File type icon (PDF, images, Word, Excel, CAD, etc.)
   - Filename and size in KB
   - View button (opens in new tab)
   - Remove button (deletes from storage)

4. **On form submission**, `request_attachments` array is saved to database:
   - `requests`
   - `g24_requests`
   - `diving_solution_requests`
   - `turney_seat_requests`

### Error Handling

If upload fails:
- File-specific error message is shown
- Other files in batch continue uploading
- Error details logged to console
- User can retry

## Common Issues

### Issue: "Failed to upload attachment" Error

**Cause 1: Bucket doesn't exist**
- Solution: Create `request-attachments` bucket in Supabase Storage

**Cause 2: Insufficient permissions**
- Solution: Check bucket policies allow authenticated uploads

**Cause 3: File too large**
- Solution: Supabase default max file size is 5GB, but check your plan limits

**Cause 4: CORS issues**
- Solution: CORS is auto-configured in Supabase Storage

### Issue: PDF signature not showing in generated PDF

**Solution**: Signature image is now automatically captured and displayed in PDFGenerator component

### Issue: Attachments not saving to database

**Cause**: Missing `request_attachments` column in database tables
- Solution: Run migration to add column to all 4 request tables

## Testing File Uploads

### Test Case 1: Single PDF Upload
1. Open job request form
2. Click "Upload Files (PDF, Images, Documents)"
3. Select a PDF file
4. Verify file appears in attachment list with 📄 icon
5. Click View to verify PDF opens
6. Click Remove to delete

### Test Case 2: Multiple File Types
1. Upload PDF + JPEG + DOCX simultaneously
2. Verify all three appear with correct icons:
   - 📄 for PDF
   - 🖼️ for JPEG
   - 📝 for DOCX
3. Verify View links work for each

### Test Case 3: Submit with Attachments
1. Fill job request form
2. Upload files
3. Submit request
4. In RequestDetails, verify attachments section shows uploaded files
5. Verify links still work after submission

## Performance Considerations

- Each file upload to Supabase takes 1-5 seconds depending on file size and network
- Multiple simultaneous uploads may be slow; recommend user uploads serially
- Files are stored with naming: `DRAFT-{timestamp}_{timestamp}.{ext}`
- Deleted files are removed from Supabase Storage immediately

## Security Notes

- `request-attachments` bucket is PUBLIC (URLs are world-readable)
- Files are not encrypted at rest
- No access control on individual files (anyone with URL can view)
- For sensitive documents, use private bucket and implement custom access

## Future Enhancements

- Add file size validation (e.g., max 10MB per file)
- Add progress bar for large file uploads
- Compress images before upload
- Scan uploaded files for malware
- Add download all attachments as ZIP
- Add file preview (PDF, images, Office documents)

## Supabase SQL Reference

To check bucket exists:
```sql
SELECT * FROM storage.buckets WHERE name = 'request-attachments';
```

To check storage objects:
```sql
SELECT name, owner, created_at, updated_at, metadata
FROM storage.objects
WHERE bucket_id = 'request-attachments'
ORDER BY created_at DESC;
```

To delete all test files:
```sql
DELETE FROM storage.objects
WHERE bucket_id = 'request-attachments' AND name LIKE 'test%';
```
