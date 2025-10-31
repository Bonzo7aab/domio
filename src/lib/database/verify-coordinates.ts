import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

/**
 * Verify that all jobs and tenders have valid coordinates
 */
export async function verifyDatabaseCoordinates(
  supabase: SupabaseClient<Database>
): Promise<{
  jobs: { total: number; withCoordinates: number; missingCoordinates: number; invalidCoordinates: number };
  tenders: { total: number; withCoordinates: number; missingCoordinates: number; invalidCoordinates: number };
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    // Check jobs
    const { data: allJobs, error: allJobsError } = await supabase
      .from('jobs')
      .select('id, title, location, latitude, longitude');

    if (allJobsError) {
      errors.push(`Failed to fetch jobs: ${allJobsError.message}`);
    }

    const jobsWithCoords = allJobs?.filter(job => 
      job.latitude && job.longitude && 
      job.latitude !== 0 && job.longitude !== 0 &&
      job.latitude >= -90 && job.latitude <= 90 &&
      job.longitude >= -180 && job.longitude <= 180
    ) || [];

    const jobsMissingCoords = allJobs?.filter(job => 
      !job.latitude || !job.longitude || 
      job.latitude === 0 || job.longitude === 0
    ) || [];

    const jobsInvalidCoords = allJobs?.filter(job => 
      job.latitude && job.longitude && 
      (job.latitude < -90 || job.latitude > 90 || 
       job.longitude < -180 || job.longitude > 180)
    ) || [];

    // Check tenders
    const { data: allTenders, error: allTendersError } = await (supabase as any)
      .from('tenders')
      .select('id, title, location, latitude, longitude');

    if (allTendersError) {
      errors.push(`Failed to fetch tenders: ${allTendersError.message}`);
    }

    const tendersWithCoords = allTenders?.filter(tender => 
      tender.latitude && tender.longitude && 
      tender.latitude !== 0 && tender.longitude !== 0 &&
      tender.latitude >= -90 && tender.latitude <= 90 &&
      tender.longitude >= -180 && tender.longitude <= 180
    ) || [];

    const tendersMissingCoords = allTenders?.filter(tender => 
      !tender.latitude || !tender.longitude || 
      tender.latitude === 0 || tender.longitude === 0
    ) || [];

    const tendersInvalidCoords = allTenders?.filter(tender => 
      tender.latitude && tender.longitude && 
      (tender.latitude < -90 || tender.latitude > 90 || 
       tender.longitude < -180 || tender.longitude > 180)
    ) || [];

    // Log details for missing coordinates
    if (jobsMissingCoords.length > 0) {
      console.warn('Jobs missing coordinates:', jobsMissingCoords.map(j => ({ id: j.id, title: j.title, location: j.location })));
    }

    if (tendersMissingCoords.length > 0) {
      console.warn('Tenders missing coordinates:', tendersMissingCoords.map(t => ({ id: t.id, title: t.title, location: t.location })));
    }

    if (jobsInvalidCoords.length > 0) {
      console.error('Jobs with invalid coordinates:', jobsInvalidCoords.map(j => ({ id: j.id, title: j.title, lat: j.latitude, lng: j.longitude })));
      errors.push(`${jobsInvalidCoords.length} jobs have invalid coordinates`);
    }

    if (tendersInvalidCoords.length > 0) {
      console.error('Tenders with invalid coordinates:', tendersInvalidCoords.map(t => ({ id: t.id, title: t.title, lat: t.latitude, lng: t.longitude })));
      errors.push(`${tendersInvalidCoords.length} tenders have invalid coordinates`);
    }

    return {
      jobs: {
        total: allJobs?.length || 0,
        withCoordinates: jobsWithCoords.length,
        missingCoordinates: jobsMissingCoords.length,
        invalidCoordinates: jobsInvalidCoords.length
      },
      tenders: {
        total: allTenders?.length || 0,
        withCoordinates: tendersWithCoords.length,
        missingCoordinates: tendersMissingCoords.length,
        invalidCoordinates: tendersInvalidCoords.length
      },
      errors
    };

  } catch (error) {
    errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      jobs: { total: 0, withCoordinates: 0, missingCoordinates: 0, invalidCoordinates: 0 },
      tenders: { total: 0, withCoordinates: 0, missingCoordinates: 0, invalidCoordinates: 0 },
      errors
    };
  }
}

/**
 * Get summary of coordinate status for display
 */
export function getCoordinateStatusSummary(status: Awaited<ReturnType<typeof verifyDatabaseCoordinates>>): string {
  const totalJobs = status.jobs.total;
  const totalTenders = status.tenders.total;
  const jobsWithCoords = status.jobs.withCoordinates;
  const tendersWithCoords = status.tenders.withCoordinates;
  const totalMissing = status.jobs.missingCoordinates + status.tenders.missingCoordinates;
  const totalInvalid = status.jobs.invalidCoordinates + status.tenders.invalidCoordinates;

  if (totalMissing === 0 && totalInvalid === 0) {
    return `✅ All ${totalJobs + totalTenders} jobs and tenders have valid coordinates`;
  }

  let summary = `📊 Coordinate Status:\n`;
  summary += `Jobs: ${jobsWithCoords}/${totalJobs} with coordinates\n`;
  summary += `Tenders: ${tendersWithCoords}/${totalTenders} with coordinates\n`;
  
  if (totalMissing > 0) {
    summary += `⚠️ ${totalMissing} records missing coordinates\n`;
  }
  
  if (totalInvalid > 0) {
    summary += `❌ ${totalInvalid} records have invalid coordinates\n`;
  }

  if (status.errors.length > 0) {
    summary += `\nErrors:\n${status.errors.join('\n')}`;
  }

  return summary;
}
