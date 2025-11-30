-- =============================================
-- UPDATE COMPANY RLS POLICIES FOR PUBLIC PROFILES
-- =============================================
-- Updates RLS policies to respect is_public flag
-- All visitors (authenticated and anonymous) can view public companies

-- Drop existing public companies policy
DROP POLICY IF EXISTS "Authenticated users can view public companies" ON companies;
DROP POLICY IF EXISTS "Anyone can view public companies" ON companies;

-- Create new policy that respects is_public flag
-- Anyone (authenticated or anonymous) can view public companies
-- Users can also view their own companies (regardless of is_public) - handled by existing policy
CREATE POLICY "Anyone can view public companies" ON companies
    FOR SELECT USING (
        is_public = true
    );

