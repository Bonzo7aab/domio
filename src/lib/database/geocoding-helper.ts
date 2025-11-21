import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { geocodeAddress } from '../google-maps/geocoding';

// Polish city coordinates for fallback
const POLISH_CITIES: Record<string, { lat: number; lng: number }> = {
  'warszawa': { lat: 52.2297, lng: 21.0122 },
  'kraków': { lat: 50.0647, lng: 19.9450 },
  'krakow': { lat: 50.0647, lng: 19.9450 },
  'gdańsk': { lat: 54.3520, lng: 18.6466 },
  'gdansk': { lat: 54.3520, lng: 18.6466 },
  'wrocław': { lat: 51.1079, lng: 17.0385 },
  'wroclaw': { lat: 51.1079, lng: 17.0385 },
  'poznań': { lat: 52.4064, lng: 16.9252 },
  'poznan': { lat: 52.4064, lng: 16.9252 },
  'łódź': { lat: 51.7592, lng: 19.4550 },
  'lodz': { lat: 51.7592, lng: 19.4550 },
  'katowice': { lat: 50.2649, lng: 19.0238 },
  'szczecin': { lat: 53.4285, lng: 14.5528 },
  'lublin': { lat: 51.2465, lng: 22.5684 },
  'białystok': { lat: 53.1325, lng: 23.1688 },
  'bialystok': { lat: 53.1325, lng: 23.1688 },
  'bydgoszcz': { lat: 53.1235, lng: 18.0084 },
  'ursynów': { lat: 52.1394, lng: 21.0458 },
  'ursynow': { lat: 52.1394, lng: 21.0458 },
  'mokotów': { lat: 52.1735, lng: 21.0422 },
  'mokotow': { lat: 52.1735, lng: 21.0422 },
  'srodmiescie': { lat: 52.2297, lng: 21.0122 },
  'śródmieście': { lat: 52.2297, lng: 21.0122 },
  'wola': { lat: 52.2297, lng: 21.0122 },
  'praga': { lat: 52.2595, lng: 21.0389 },
  'żoliborz': { lat: 52.2595, lng: 20.9796 },
  'zoliborz': { lat: 52.2595, lng: 20.9796 }
};

interface GeocodingResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  error?: string;
}

interface BatchGeocodingOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  useCityFallback?: boolean;
  updateDatabase?: boolean;
}

/**
 * Wait for Google Maps API to load
 */
async function waitForGoogleMaps(maxWait = 5000): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if already loaded
  if (window.google?.maps?.Geocoder) {
    return true;
  }

  // Wait for it to load
  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.Geocoder) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Geocode a single address using Google Maps API or city fallback
 */
export async function geocodeAddressWithFallback(
  address: string,
  options: { useCityFallback?: boolean } = {}
): Promise<GeocodingResult> {
  // Check if Google Maps is available, wait a bit if not
  const googleMapsAvailable = await waitForGoogleMaps(2000);
  
  if (googleMapsAvailable) {
    try {
      // Try Google Maps geocoding first
      const result = await geocodeAddress(address);
      if (result) {
        return {
          success: true,
          latitude: result.coordinates.lat,
          longitude: result.coordinates.lng,
          address: result.formattedAddress
        };
      }
    } catch (error) {
      // Silently fall through to city fallback
      console.warn('Google Maps geocoding failed, using fallback:', error);
    }
  }

  // Fallback to city-based coordinates
  if (options.useCityFallback !== false) {
    const cityCoords = findCityCoordinates(address);
    if (cityCoords) {
      return {
        success: true,
        latitude: cityCoords.lat,
        longitude: cityCoords.lng,
        address: `${address} (city fallback)`
      };
    }
  }

  return {
    success: false,
    error: 'Unable to geocode address and no city fallback found'
  };
}

/**
 * Find city coordinates from address string
 */
function findCityCoordinates(address: string): { lat: number; lng: number } | null {
  const normalizedAddress = address.toLowerCase().trim();
  
  for (const [cityName, coords] of Object.entries(POLISH_CITIES)) {
    if (normalizedAddress.includes(cityName)) {
      return coords;
    }
  }
  
  return null;
}

/**
 * Batch geocode jobs that are missing coordinates
 */
export async function batchGeocodeJobs(
  supabase: SupabaseClient<Database>,
  options: BatchGeocodingOptions = {}
): Promise<{ processed: number; success: number; failed: number; errors: string[] }> {
  const {
    batchSize = 10,
    delayBetweenBatches = 1000,
    useCityFallback = true,
    updateDatabase = true
  } = options;

  let processed = 0;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get jobs without coordinates
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, location, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null,latitude.eq.0,longitude.eq.0')
      .limit(100); // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch jobs: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs need geocoding');
      return { processed: 0, success: 0, failed: 0, errors: [] };
    }

    console.log(`Found ${jobs.length} jobs that need geocoding`);

    // Process in batches
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      for (const job of batch) {
        processed++;
        const fullAddress = [job.address, job.location].filter(Boolean).join(', ');
        
        if (!fullAddress) {
          failed++;
          errors.push(`Job ${job.id}: No address information available`);
          continue;
        }

        try {
          const result = await geocodeAddressWithFallback(fullAddress, { useCityFallback });
          
          if (result.success && result.latitude && result.longitude) {
            success++;
            
            if (updateDatabase) {
              const { error: updateError } = await supabase
                .from('jobs')
                .update({
                  latitude: result.latitude,
                  longitude: result.longitude
                })
                .eq('id', job.id);

              if (updateError) {
                errors.push(`Job ${job.id}: Failed to update database - ${updateError.message}`);
              } else {
                console.log(`✓ Geocoded job ${job.id}: ${result.address}`);
              }
            }
          } else {
            failed++;
            errors.push(`Job ${job.id}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Delay between batches
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

  } catch (error) {
    errors.push(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, success, failed, errors };
}

/**
 * Batch geocode tenders that are missing coordinates
 */
export async function batchGeocodeTenders(
  supabase: SupabaseClient<Database>,
  options: BatchGeocodingOptions = {}
): Promise<{ processed: number; success: number; failed: number; errors: string[] }> {
  const {
    batchSize = 10,
    delayBetweenBatches = 1000,
    useCityFallback = true,
    updateDatabase = true
  } = options;

  let processed = 0;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get tenders without coordinates
    const { data: tenders, error: fetchError } = await (supabase as any)
      .from('tenders')
      .select('id, title, location, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null,latitude.eq.0,longitude.eq.0')
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch tenders: ${fetchError.message}`);
    }

    if (!tenders || tenders.length === 0) {
      console.log('No tenders need geocoding');
      return { processed: 0, success: 0, failed: 0, errors: [] };
    }

    console.log(`Found ${tenders.length} tenders that need geocoding`);

    // Process in batches
    for (let i = 0; i < tenders.length; i += batchSize) {
      const batch = tenders.slice(i, i + batchSize);
      
      for (const tender of batch) {
        processed++;
        const fullAddress = [tender.address, tender.location].filter(Boolean).join(', ');
        
        if (!fullAddress) {
          failed++;
          errors.push(`Tender ${tender.id}: No address information available`);
          continue;
        }

        try {
          const result = await geocodeAddressWithFallback(fullAddress, { useCityFallback });
          
          if (result.success && result.latitude && result.longitude) {
            success++;
            
            if (updateDatabase) {
              const { error: updateError } = await (supabase as any)
                .from('tenders')
                .update({
                  latitude: result.latitude,
                  longitude: result.longitude
                })
                .eq('id', tender.id);

              if (updateError) {
                errors.push(`Tender ${tender.id}: Failed to update database - ${updateError.message}`);
              } else {
                console.log(`✓ Geocoded tender ${tender.id}: ${result.address}`);
              }
            }
          } else {
            failed++;
            errors.push(`Tender ${tender.id}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Tender ${tender.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Delay between batches
      if (i + batchSize < tenders.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

  } catch (error) {
    errors.push(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, success, failed, errors };
}

/**
 * Check geocoding status for jobs and tenders
 */
export async function checkGeocodingStatus(
  supabase: SupabaseClient<Database>
): Promise<{
  jobs: { total: number; withCoordinates: number; missingCoordinates: number };
  tenders: { total: number; withCoordinates: number; missingCoordinates: number };
}> {
  try {
    // Check jobs
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    const { count: jobsWithCoords } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Check tenders
    const { count: totalTenders } = await (supabase as any)
      .from('tenders')
      .select('*', { count: 'exact', head: true });

    const { count: tendersWithCoords } = await (supabase as any)
      .from('tenders')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    return {
      jobs: {
        total: totalJobs || 0,
        withCoordinates: jobsWithCoords || 0,
        missingCoordinates: (totalJobs || 0) - (jobsWithCoords || 0)
      },
      tenders: {
        total: totalTenders || 0,
        withCoordinates: tendersWithCoords || 0,
        missingCoordinates: (totalTenders || 0) - (tendersWithCoords || 0)
      }
    };
  } catch (error) {
    console.error('Failed to check geocoding status:', error);
    return {
      jobs: { total: 0, withCoordinates: 0, missingCoordinates: 0 },
      tenders: { total: 0, withCoordinates: 0, missingCoordinates: 0 }
    };
  }
}
