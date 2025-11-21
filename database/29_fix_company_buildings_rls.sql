-- =============================================
-- FIX: Add missing RLS policies for companies and buildings
-- =============================================
-- This migration adds the missing INSERT policy for companies
-- and all policies for buildings table

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;

-- Add INSERT policy for companies
CREATE POLICY "Users can insert companies" ON companies
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- BUILDINGS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view company buildings" ON buildings;
DROP POLICY IF EXISTS "Authenticated users can view public buildings" ON buildings;
DROP POLICY IF EXISTS "Users can insert company buildings" ON buildings;
DROP POLICY IF EXISTS "Users can update company buildings" ON buildings;
DROP POLICY IF EXISTS "Users can delete company buildings" ON buildings;

-- Users can view buildings for companies they're associated with
CREATE POLICY "Users can view company buildings" ON buildings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
        )
    );

-- Public buildings can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public buildings" ON buildings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert buildings for companies they own or manage
CREATE POLICY "Users can insert company buildings" ON buildings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can update buildings for companies they own or manage
CREATE POLICY "Users can update company buildings" ON buildings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can delete buildings for companies they own or manage
CREATE POLICY "Users can delete company buildings" ON buildings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE ''
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE ''
    END as with_check_clause
FROM pg_policies
WHERE tablename IN ('companies', 'buildings')
ORDER BY tablename, policyname;

