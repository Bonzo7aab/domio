-- =============================================
-- FIX STORAGE RLS POLICIES FOR PORTFOLIO IMAGES
-- =============================================
-- Ensures storage bucket policies allow portfolio image uploads
-- Portfolio images use: {userId}/portfolio/{projectId}/{filename}
-- Existing policies check first folder (userId), which should work for both
-- job paths and portfolio paths

-- =============================================
-- DROP EXISTING POLICIES (to recreate them)
-- =============================================
DROP POLICY IF EXISTS "Users can upload job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view job attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete job attachments" ON storage.objects;

-- =============================================
-- CREATE INSERT POLICY (Allows uploads)
-- =============================================
-- This policy allows authenticated users to upload files where
-- the first folder in the path is their user ID
-- Works for: {userId}/jobs/* and {userId}/portfolio/*
CREATE POLICY "Users can upload job attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- CREATE SELECT POLICY (Allows viewing)
-- =============================================
CREATE POLICY "Users can view job attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- CREATE DELETE POLICY (Allows deleting)
-- =============================================
CREATE POLICY "Users can delete job attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'job-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- VERIFICATION QUERY
-- =============================================
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN with_check IS NOT NULL THEN with_check
        WHEN qual IS NOT NULL THEN qual
        ELSE 'No condition'
    END as policy_condition
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%job attachment%'
ORDER BY cmd;
