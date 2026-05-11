import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export interface AdminDashboardMetrics {
  activeJobsWithoutApplications: number;
  activeTendersWithoutBids: number;
  staleJobApplications: number;
  staleTenderBids: number;
  contractorsOcExpiring7d: number;
}

function startOfTodayUtcDate(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function endOfSevenDaysUtcDate(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregates health metrics for the admin dashboard (RLS: caller must be platform_admin).
 */
export async function fetchAdminDashboardMetrics(
  supabase: SupabaseClient<Database>
): Promise<AdminDashboardMetrics> {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const today = startOfTodayUtcDate();
  const weekEnd = endOfSevenDaysUtcDate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: activeJobs, error: jobsError } = await supabase.from('jobs').select('id').eq('status', 'active');

  if (jobsError) {
    console.error('fetchAdminDashboardMetrics jobs', jobsError);
  }

  const jobIds = (activeJobs ?? []).map((j: { id: string }) => j.id);
  let activeJobsWithoutApplications = 0;

  if (jobIds.length > 0) {
    const { data: appsRows } = await sb.from('job_applications').select('job_id').in('job_id', jobIds);
    const withApps = new Set((appsRows ?? []).map((r: { job_id: string }) => r.job_id));
    activeJobsWithoutApplications = jobIds.filter((id: string) => !withApps.has(id)).length;
  }

  const { data: activeTenders, error: tendersError } = await sb
    .from('tenders')
    .select('id')
    .eq('status', 'active');

  if (tendersError) {
    console.error('fetchAdminDashboardMetrics tenders', tendersError);
  }

  const tenderIds = (activeTenders ?? []).map((t: { id: string }) => t.id);
  let activeTendersWithoutBids = 0;

  if (tenderIds.length > 0) {
    const { data: bidRows } = await sb.from('tender_bids').select('tender_id').in('tender_id', tenderIds);
    const withBids = new Set((bidRows ?? []).map((r: { tender_id: string }) => r.tender_id));
    activeTendersWithoutBids = tenderIds.filter((id: string) => !withBids.has(id)).length;
  }

  const staleStatuses = ['submitted', 'under_review'];

  const { count: staleJobApplications } = await sb
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .in('status', staleStatuses)
    .neq('admin_moderation_status', 'suspended')
    .lt('submitted_at', fortyEightHoursAgo);

  const { count: staleTenderBids } = await sb
    .from('tender_bids')
    .select('*', { count: 'exact', head: true })
    .in('status', staleStatuses)
    .neq('admin_moderation_status', 'suspended')
    .lt('submitted_at', fortyEightHoursAgo);

  const { count: contractorsOcExpiring7d } = await sb
    .from('contractor_account_settings')
    .select('*', { count: 'exact', head: true })
    .gte('oc_valid_until', today)
    .lte('oc_valid_until', weekEnd);

  return {
    activeJobsWithoutApplications,
    activeTendersWithoutBids,
    staleJobApplications: staleJobApplications ?? 0,
    staleTenderBids: staleTenderBids ?? 0,
    contractorsOcExpiring7d: contractorsOcExpiring7d ?? 0,
  };
}
