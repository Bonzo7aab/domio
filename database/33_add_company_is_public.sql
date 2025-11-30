-- =============================================
-- ADD IS_PUBLIC COLUMN TO COMPANIES TABLE
-- =============================================
-- Adds is_public boolean field to companies table
-- Defaults to TRUE (public profile by default)

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Add index for performance when filtering by public status
CREATE INDEX IF NOT EXISTS idx_companies_is_public ON companies(is_public) WHERE is_public = true;

-- Add comment for documentation
COMMENT ON COLUMN companies.is_public IS 'Whether the company profile is publicly visible to other users on the platform';

