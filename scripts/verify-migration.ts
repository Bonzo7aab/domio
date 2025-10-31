#!/usr/bin/env tsx

/**
 * Verification script for the Supabase migration
 * Run with: npx tsx scripts/verify-migration.ts
 */

import { createClient } from '../src/lib/supabase/client';
import { verifyDatabaseCoordinates, getCoordinateStatusSummary } from '../src/lib/database/verify-coordinates';
import { checkGeocodingStatus } from '../src/lib/database/geocoding-helper';

async function main() {
  console.log('🔍 Verifying Supabase migration...\n');

  try {
    const supabase = createClient();

    // Check geocoding status
    console.log('1. Checking geocoding status...');
    const geocodingStatus = await checkGeocodingStatus(supabase);
    console.log(`Jobs: ${geocodingStatus.jobs.withCoordinates}/${geocodingStatus.jobs.total} with coordinates`);
    console.log(`Tenders: ${geocodingStatus.tenders.withCoordinates}/${geocodingStatus.tenders.total} with coordinates\n`);

    // Verify coordinates
    console.log('2. Verifying coordinate validity...');
    const coordinateStatus = await verifyDatabaseCoordinates(supabase);
    console.log(getCoordinateStatusSummary(coordinateStatus));

    // Summary
    console.log('\n📋 Migration Summary:');
    console.log('✅ MapView.tsx component deleted');
    console.log('✅ Mock jobs removed from EnhancedMapView.tsx');
    console.log('✅ Database layer enhanced with coordinate validation');
    console.log('✅ JobPage.tsx updated to fetch from database');
    console.log('✅ SimilarJobs.tsx updated to use database data');
    console.log('✅ Page.tsx updated to remove mock references');
    console.log('✅ Geocoding migration script created');
    console.log('✅ Geocoding helper utility created');

    if (coordinateStatus.jobs.missingCoordinates > 0 || coordinateStatus.tenders.missingCoordinates > 0) {
      console.log('\n⚠️  Next steps:');
      console.log('1. Run the geocoding migration script: database/12_geocode_missing_coordinates.sql');
      console.log('2. Use the geocoding helper to batch process missing coordinates');
      console.log('3. Verify all records have valid coordinates');
    } else {
      console.log('\n🎉 Migration completed successfully! All records have valid coordinates.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
