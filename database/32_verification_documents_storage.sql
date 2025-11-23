=============================================
DOMIO PLATFORM - VERIFICATION DOCUMENTS STORAGE
=============================================
Storage bucket setup and RLS policies for verification documents

NOTE: Storage buckets in Supabase must be created via:
1. Supabase Dashboard: Storage > Create Bucket
2. Supabase CLI: supabase storage create verification-documents --private
3. Supabase Management API

This file documents the RLS policies that should be applied to the bucket.
Apply these policies via Supabase Dashboard: Storage > verification-documents > Policies

=============================================
STORAGE BUCKET: verification-documents
=============================================
Bucket should be created with:
- Name: verification-documents
- Public: false (private with RLS policies)
- File size limit: 10MB
- Allowed MIME types: 
  Images: image/jpeg, image/jpg, image/png
  Documents: application/pdf

=============================================
STORAGE POLICIES (Apply via Dashboard or API)
=============================================
File path structure: {userId}/verification/{documentType}/{timestamp}-{random}.{ext}

Policy 1: Users can upload to their own folder
Policy Name: "Users can upload verification documents"
Policy Type: INSERT
Policy Definition:
  (bucket_id = 'verification-documents'::text) AND 
  (auth.role() = 'authenticated'::text) AND
  ((storage.foldername(name))[1] = auth.uid()::text)

Policy 2: Users can view files in their folder
Policy Name: "Users can view verification documents"
Policy Type: SELECT
Policy Definition:
  (bucket_id = 'verification-documents'::text) AND 
  (auth.role() = 'authenticated'::text) AND
  ((storage.foldername(name))[1] = auth.uid()::text)

Policy 3: Users can delete files in their folder
Policy Name: "Users can delete verification documents"
Policy Type: DELETE
Policy Definition:
  (bucket_id = 'verification-documents'::text) AND 
  (auth.role() = 'authenticated'::text) AND
  ((storage.foldername(name))[1] = auth.uid()::text)

-- =============================================
-- EXECUTABLE SQL POLICIES
-- =============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete verification documents" ON storage.objects;

-- Policy 1: Users can upload to their own folder
-- This allows authenticated users to upload files where the first folder is their user ID
CREATE POLICY "Users can upload verification documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view files in their folder
-- This allows authenticated users to view files where the first folder is their user ID
CREATE POLICY "Users can view verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete files in their folder
-- This allows authenticated users to delete files where the first folder is their user ID
CREATE POLICY "Users can delete verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
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
AND policyname LIKE '%verification%'
ORDER BY policyname;

-- =============================================
-- SETUP INSTRUCTIONS
-- =============================================
1. Create the bucket via Supabase Dashboard:
   - Go to Storage > New Bucket
   - Name: verification-documents
   - Public: false (private bucket with RLS)
   - File size limit: 10485760 (10MB)

2. Apply RLS policies:
   - Run this SQL file to create the policies automatically (recommended)
   - OR apply via Dashboard: Storage > verification-documents > Policies
   - The folder-based policies ensure users can only access their own documents

3. Verify bucket is accessible:
   - Test upload via the application (/verification page)
   - Check that files are stored in the correct folder structure: {userId}/verification/{documentType}/
   - Verify RLS policies prevent unauthorized access

=============================================
NOTES
=============================================
- Files are stored in private bucket for security
- Path structure: {userId}/verification/{documentType}/{filename}
- Document types include:
  - Contractors: company_registration, insurance, certifications, references
  - Managers: company_registration, management_license, management_contracts, insurance
- Users can only access their own verification documents
- Files are automatically organized by document type for easier management
- Consider implementing admin policies if staff need to review documents

