-- =============================================
-- FIX: Add missing INSERT policy for companies table
-- =============================================
-- This allows authenticated users to create companies

-- Add INSERT policy for companies
CREATE POLICY "Authenticated users can insert companies" ON companies
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Optional: Add DELETE policy for company owners
CREATE POLICY "Company owners can delete their companies" ON companies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = companies.id 
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;

