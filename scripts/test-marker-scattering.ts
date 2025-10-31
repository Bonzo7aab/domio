import { createClient } from '../src/lib/supabase/client';
import { fetchJobsAndTenders } from '../src/lib/database/jobs';

/**
 * Test script to verify marker scattering is working
 */
async function testMarkerScattering() {
  console.log('🧪 Testing marker scattering...\n');

  const supabase = createClient();

  // Fetch jobs and tenders
  const { data: items, error } = await fetchJobsAndTenders(supabase, { limit: 20 });

  if (error) {
    console.error('❌ Error fetching data:', error);
    return;
  }

  if (!items || items.length === 0) {
    console.log('⚠️ No items found in database');
    return;
  }

  console.log(`📊 Found ${items.length} items to analyze\n`);

  // Group by location to see scattering
  const locationGroups: Record<string, Array<{ id: string; lat: number; lng: number; title: string }>> = {};

  items.forEach(item => {
    if (!locationGroups[item.location]) {
      locationGroups[item.location] = [];
    }
    locationGroups[item.location].push({
      id: item.id,
      lat: item.lat || 0,
      lng: item.lng || 0,
      title: item.title
    });
  });

  // Analyze each location
  Object.entries(locationGroups).forEach(([location, markers]) => {
    console.log(`📍 Location: ${location}`);
    console.log(`   Markers: ${markers.length}`);
    
    if (markers.length > 1) {
      // Check if markers are scattered
      const uniquePositions = new Set();
      markers.forEach(marker => {
        uniquePositions.add(`${marker.lat.toFixed(6)},${marker.lng.toFixed(6)}`);
      });
      
      console.log(`   Unique positions: ${uniquePositions.size}`);
      
      if (uniquePositions.size > 1) {
        console.log('   ✅ Markers are scattered!');
        
        // Show coordinate variations
        markers.forEach((marker, index) => {
          console.log(`     ${index + 1}. ${marker.title.substring(0, 30)}...`);
          console.log(`        Lat: ${marker.lat.toFixed(6)}, Lng: ${marker.lng.toFixed(6)}`);
        });
      } else {
        console.log('   ⚠️ All markers at same position');
      }
    } else {
      console.log('   ℹ️ Only one marker in this location');
    }
    console.log('');
  });

  // Summary
  const totalUniquePositions = new Set();
  items.forEach(item => {
    if (item.lat && item.lng) {
      totalUniquePositions.add(`${item.lat.toFixed(6)},${item.lng.toFixed(6)}`);
    }
  });

  console.log(`📈 Summary:`);
  console.log(`   Total items: ${items.length}`);
  console.log(`   Unique positions: ${totalUniquePositions.size}`);
  console.log(`   Scattering efficiency: ${((totalUniquePositions.size / items.length) * 100).toFixed(1)}%`);
  
  if (totalUniquePositions.size === items.length) {
    console.log('   🎉 Perfect! All markers have unique positions');
  } else if (totalUniquePositions.size > items.length * 0.8) {
    console.log('   ✅ Good scattering! Most markers have unique positions');
  } else {
    console.log('   ⚠️ Some markers may still be overlapping');
  }
}

testMarkerScattering().catch(console.error);
