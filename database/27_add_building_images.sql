-- =============================================
-- DOMIO PLATFORM - ADD IMAGES TO BUILDINGS
-- =============================================
-- Add images column to buildings table

-- Add images column (array of image URLs)
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add index for image queries (if needed for filtering)
CREATE INDEX IF NOT EXISTS idx_buildings_has_images ON buildings USING GIN (images) WHERE array_length(images, 1) > 0;

-- Add comment
COMMENT ON COLUMN buildings.images IS 'Array of image URLs stored in Supabase storage';

