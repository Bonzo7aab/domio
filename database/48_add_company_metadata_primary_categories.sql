-- Add metadata JSONB to companies for registration data (e.g. contractor primary_category_slugs).
-- Existing rows are unaffected; new contractors store categories here.
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN companies.metadata IS 'Optional JSON: primary_category_slugs (string[]) for contractors, or other registration/profile data.';
