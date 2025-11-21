-- =============================================
-- FIX: Add Storage RLS policies for building-images bucket
-- =============================================
-- This migration adds the missing storage bucket policies
-- 
-- NOTE: Storage policies must be applied via Supabase Dashboard or Management API
-- This file provides the SQL to create them via the storage.objects table policies
--
-- The file path structure is: {userId}/{buildingId}/{filename}
-- So we check that the first folder matches auth.uid()

-- =============================================
-- STORAGE POLICIES FOR building-images BUCKET
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their folder images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their folder images" ON storage.objects;
DROP POLICY IF EXISTS "Managers can upload building images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view building images" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete building images" ON storage.objects;

-- Policy 1: Users can upload to their own folder
-- This allows authenticated users to upload files where the first folder is their user ID
CREATE POLICY "Users can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'building-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view images in their folder
-- This allows authenticated users to view files where the first folder is their user ID
CREATE POLICY "Users can view their folder images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'building-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete images in their folder
-- This allows authenticated users to delete files where the first folder is their user ID
CREATE POLICY "Users can delete their folder images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'building-images' AND
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
AND policyname LIKE '%folder%'
ORDER BY policyname;

-- =============================================
-- ALTERNATIVE: If you prefer to apply via Dashboard
-- =============================================
-- Go to Supabase Dashboard > Storage > building-images > Policies
-- Add these policies manually:
--
-- Policy 1: INSERT
-- Name: "Users can upload to their folder"
-- Definition: (bucket_id = 'building-images'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
--
-- Policy 2: SELECT
-- Name: "Users can view their folder images"
-- Definition: (bucket_id = 'building-images'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
--
-- Policy 3: DELETE
-- Name: "Users can delete their folder images"
-- Definition: (bucket_id = 'building-images'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)

