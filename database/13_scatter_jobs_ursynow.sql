-- Migration: Scatter all jobs around Ursynów, Warszawa
-- This script updates all existing jobs to have random coordinates scattered around Ursynów district
-- Ursynów center coordinates: 52.1394, 21.0458

-- Update all jobs with random coordinates scattered around Ursynów
-- Scattering radius: ±0.02 degrees (approximately ±2.2km from Ursynów center)
UPDATE jobs SET 
  latitude = 52.1394 + (RANDOM() - 0.5) * 0.04,
  longitude = 21.0458 + (RANDOM() - 0.5) * 0.04
WHERE id IS NOT NULL;

-- Update all tenders with random coordinates scattered around Ursynów
UPDATE tenders SET 
  latitude = 52.1394 + (RANDOM() - 0.5) * 0.04,
  longitude = 21.0458 + (RANDOM() - 0.5) * 0.04
WHERE id IS NOT NULL;

-- Verify the updates
SELECT 
  'JOBS AFTER SCATTERING' as table_name,
  COUNT(*) as total_count,
  MIN(latitude) as min_lat,
  MAX(latitude) as max_lat,
  MIN(longitude) as min_lng,
  MAX(longitude) as max_lng,
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng
FROM jobs;

SELECT 
  'TENDERS AFTER SCATTERING' as table_name,
  COUNT(*) as total_count,
  MIN(latitude) as min_lat,
  MAX(latitude) as max_lat,
  MIN(longitude) as min_lng,
  MAX(longitude) as max_lng,
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng
FROM tenders;

-- Show sample of scattered coordinates
SELECT 
  'SAMPLE SCATTERED JOBS' as description,
  id,
  title,
  location,
  latitude,
  longitude,
  ROUND(latitude::numeric, 6) as lat_rounded,
  ROUND(longitude::numeric, 6) as lng_rounded
FROM jobs 
ORDER BY RANDOM() 
LIMIT 10;

SELECT 
  'SAMPLE SCATTERED TENDERS' as description,
  id,
  title,
  location,
  latitude,
  longitude,
  ROUND(latitude::numeric, 6) as lat_rounded,
  ROUND(longitude::numeric, 6) as lng_rounded
FROM tenders 
ORDER BY RANDOM() 
LIMIT 10;

-- Check for any duplicate coordinates (should be very rare with random scattering)
SELECT 
  'DUPLICATE COORDINATES CHECK' as check_type,
  latitude,
  longitude,
  COUNT(*) as duplicate_count
FROM (
  SELECT latitude, longitude FROM jobs
  UNION ALL
  SELECT latitude, longitude FROM tenders
) all_coords
GROUP BY latitude, longitude
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Summary
SELECT 
  'MIGRATION SUMMARY' as summary,
  'All jobs and tenders have been scattered around Ursynów, Warszawa' as description,
  'Scattering radius: ±2.2km from Ursynów center (52.1394, 21.0458)' as radius_info,
  'Each record now has unique random coordinates' as result;
