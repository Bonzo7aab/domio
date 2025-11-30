-- =============================================
-- FIX PORTFOLIO PROJECTS RLS POLICIES
-- =============================================
-- Updates RLS policies to check is_active on user_companies
-- This ensures only active company members can manage portfolio projects

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert portfolio projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can update portfolio projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can delete portfolio projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can insert portfolio project images" ON portfolio_project_images;
DROP POLICY IF EXISTS "Users can update portfolio project images" ON portfolio_project_images;
DROP POLICY IF EXISTS "Users can delete portfolio project images" ON portfolio_project_images;

-- Users can insert portfolio projects for their companies (with is_active check)
CREATE POLICY "Users can insert portfolio projects" ON portfolio_projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can update portfolio projects for their companies (with is_active check)
CREATE POLICY "Users can update portfolio projects" ON portfolio_projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can delete portfolio projects for their companies (with is_active check)
CREATE POLICY "Users can delete portfolio projects" ON portfolio_projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can insert portfolio project images for their projects (with is_active check)
CREATE POLICY "Users can insert portfolio project images" ON portfolio_project_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            JOIN user_companies ON user_companies.company_id = portfolio_projects.company_id
            WHERE portfolio_projects.id = portfolio_project_images.project_id 
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'manager')
            AND user_companies.is_active = true
        )
    );

-- Users can update portfolio project images for their projects (with is_active check)
CREATE POLICY "Users can update portfolio project images" ON portfolio_project_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            JOIN user_companies ON user_companies.company_id = portfolio_projects.company_id
            WHERE portfolio_projects.id = portfolio_project_images.project_id 
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'manager')
            AND user_companies.is_active = true
        )
    );

-- Users can delete portfolio project images for their projects (with is_active check)
CREATE POLICY "Users can delete portfolio project images" ON portfolio_project_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            JOIN user_companies ON user_companies.company_id = portfolio_projects.company_id
            WHERE portfolio_projects.id = portfolio_project_images.project_id 
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'manager')
            AND user_companies.is_active = true
        )
    );

-- Verify policies were updated
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
WHERE tablename IN ('portfolio_projects', 'portfolio_project_images')
ORDER BY tablename, policyname;

