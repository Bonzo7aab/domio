=============================================
DOMIO PLATFORM - JOB ATTACHMENTS STORAGE
=============================================
Storage bucket setup and RLS policies for job attachments

NOTE: Storage buckets in Supabase must be created via:
1. Supabase Dashboard: Storage > Create Bucket
2. Supabase CLI: supabase storage create job-attachments --public
3. Supabase Management API

This file documents the RLS policies that should be applied to the bucket.
Apply these policies via Supabase Dashboard: Storage > job-attachments > Policies

=============================================
STORAGE BUCKET: job-attachments
=============================================
Bucket should be created with:
- Name: job-attachments
- Public: true (or false with proper RLS policies)
- File size limit: 10MB
- Allowed MIME types: 
  Images: image/jpeg, image/jpg, image/png, image/webp, image/gif
  Documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

=============================================
STORAGE POLICIES (Apply via Dashboard or API)
=============================================
File path structure: {userId}/jobs/{jobId|draft}/{timestamp}-{random}.{ext}

Policy 1: Users can upload to their own folder
Policy Name: "Users can upload job attachments"
Policy Type: INSERT
Policy Definition:
  (bucket_id = 'job-attachments'::text) AND 
  (auth.role() = 'authenticated'::text) AND
  ((storage.foldername(name))[1] = auth.uid()::text)

Policy 2: Users can view files in their folder
Policy Name: "Users can view job attachments"
Policy Type: SELECT
Policy Definition:
  (bucket_id = 'job-attachments'::text) AND 
  (auth.role() = 'authenticated'::text) AND
  ((storage.foldername(name))[1] = auth.uid()::text)

Policy 3: Users can delete files in their folder
Policy Name: "Users can delete job attachments"
Policy Type: DELETE
Policy Definition:
  (bucket_id = 'job-attachments'::text) AND 
  (auth.role() = 'authenticated'::text) AND
  ((storage.foldername(name))[1] = auth.uid()::text)

-- =============================================
-- EXECUTABLE SQL POLICIES
-- =============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Managers can upload job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete job attachments" ON storage.objects;

-- Policy 1: Users can upload to their own folder
-- This allows authenticated users to upload files where the first folder is their user ID
CREATE POLICY "Users can upload job attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view files in their folder
-- This allows authenticated users to view files where the first folder is their user ID
CREATE POLICY "Users can view job attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete files in their folder
-- This allows authenticated users to delete files where the first folder is their user ID
CREATE POLICY "Users can delete job attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- VERIFICATION
-- =============================================
-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%job%'
ORDER BY policyname;

-- =============================================
-- ALTERNATIVE: JOB-BASED POLICIES (If needed)
-- =============================================
-- If you want to restrict access based on job ownership, uncomment and use these policies instead:
-- (These provide stricter access control by checking job ownership)


-- First, drop the simpler folder-based policies
DROP POLICY IF EXISTS "Users can upload job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete job attachments" ON storage.objects;

-- Policy 1 (Job-based): Users can upload attachments for jobs they created
CREATE POLICY "Managers can upload job attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (
        (storage.foldername(name))[3] = 'draft'::text OR
        EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id::text = (storage.foldername(name))[3]
            AND j.manager_id = auth.uid()
        )
    )
);

-- Policy 2 (Job-based): Users can view attachments for jobs they have access to
CREATE POLICY "Users can view job attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'job-attachments' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id::text = (storage.foldername(name))[3]
            AND j.is_public = true
        )
    )
);

-- Policy 3 (Job-based): Users can delete attachments for jobs they created
CREATE POLICY "Managers can delete job attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (
        (storage.foldername(name))[3] = 'draft'::text OR
        EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id::text = (storage.foldername(name))[3]
            AND j.manager_id = auth.uid()
        )
    )
);


=============================================
SETUP INSTRUCTIONS
=============================================
1. Create the bucket via Supabase Dashboard:
   - Go to Storage > New Bucket
   - Name: job-attachments
   - Public: true (recommended for easier access)
   - File size limit: 10485760 (10MB)

2. Apply RLS policies:
   - Run this SQL file to create the policies automatically (recommended)
   - OR apply via Dashboard: Storage > job-attachments > Policies
   - The simpler folder-based policies are created by default above
   - See ALTERNATIVE section below for job-based policies if you need stricter access control

3. Verify bucket is accessible:
   - Test upload via the application (/post-job page)
   - Check that files are accessible via public URLs
   - Verify files are stored in the correct folder structure: {userId}/jobs/{jobId|draft}/

=============================================
NOTES
=============================================
- Files uploaded before job creation are stored in {userId}/jobs/draft/
- After job creation, files can be moved to {userId}/jobs/{jobId}/ (optional)
- The application handles cleanup of draft files if job creation fails
- File URLs are stored in the jobs.images array field

