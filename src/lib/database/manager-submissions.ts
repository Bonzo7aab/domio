import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { getJobWorkflowStatusLabel } from '../job-workflow-status';
import { getTenderWorkflowStatusLabel } from '../tender-workflow-status';
import { fetchReviewedTenderIdsForReviewer } from './reviews';

export type ManagerSubmissionKind = 'job' | 'contest';

export interface ManagerSubmission {
  id: string;
  kind: ManagerSubmissionKind;
  title: string;
  status: string;
  offersCount: number;
  newOffersCount: number;
  /** ISO timestamp of the most recently submitted offer, or null if none. */
  lastOfferAt: string | null;
  createdAt: string;
  /** Editable when draft (and no offers for jobs; tenders: draft only, see updateTender). */
  canEdit: boolean;
  /** Job/tender has an accepted offer (Wybrana Oferta). */
  hasSelectedOffer: boolean;
  /** Manager already submitted cooperation review (tender with selected offer only). */
  hasCooperationReview: boolean;
}

function jobStatusLabel(status: string): string {
  return getJobWorkflowStatusLabel(status);
}

function tenderStatusLabel(status: string): string {
  return getTenderWorkflowStatusLabel(status);
}

export function getSubmissionStatusLabel(kind: ManagerSubmissionKind, status: string): string {
  return kind === 'job' ? jobStatusLabel(status) : tenderStatusLabel(status);
}

/**
 * Unified list of jobs and tenders for the manager "Moje zgłoszenia" table.
 */
export async function fetchManagerSubmissions(
  supabase: SupabaseClient<Database>,
  companyId: string,
  managerUserId?: string,
): Promise<ManagerSubmission[]> {
  const [jobsRes, tendersRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenders not in generated Database types
    (supabase as any)
      .from('contests')
      .select('id, title, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  const jobRows = jobsRes.data || [];
  const tenderRows = tendersRes.data || [];

  const jobIds = jobRows.map((j) => j.id);
  const tenderIds = tenderRows.map((t) => t.id);

  const jobOfferCounts: Record<string, { total: number; newCount: number }> = {};
  const tenderOfferCounts: Record<string, { total: number; newCount: number }> = {};
  const jobLastOfferAt: Record<string, string> = {};
  const tenderLastOfferAt: Record<string, string> = {};
  const jobHasSelectedOffer: Record<string, boolean> = {};
  const tenderHasSelectedOffer: Record<string, boolean> = {};

  if (jobIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: apps } = await (supabase as any)
      .from('job_applications')
      .select('job_id, status, submitted_at')
      .in('job_id', jobIds);

    for (const row of apps || []) {
      const jid = row.job_id as string;
      if (!jobOfferCounts[jid]) jobOfferCounts[jid] = { total: 0, newCount: 0 };
      jobOfferCounts[jid].total += 1;
      if (row.status === 'accepted') {
        jobHasSelectedOffer[jid] = true;
      }
      if (row.status === 'submitted') {
        jobOfferCounts[jid].newCount += 1;
      }
      const submittedAt = row.submitted_at as string | null | undefined;
      if (submittedAt) {
        const prev = jobLastOfferAt[jid];
        if (!prev || new Date(submittedAt).getTime() > new Date(prev).getTime()) {
          jobLastOfferAt[jid] = submittedAt;
        }
      }
    }
  }

  if (tenderIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bids } = await (supabase as any)
      .from('contest_offers')
      .select('contest_id, status, submitted_at')
      .in('contest_id', tenderIds);

    for (const row of bids || []) {
      const tid = row.contest_id as string;
      if (!tenderOfferCounts[tid]) tenderOfferCounts[tid] = { total: 0, newCount: 0 };
      tenderOfferCounts[tid].total += 1;
      if (row.status === 'accepted') {
        tenderHasSelectedOffer[tid] = true;
      }
      if (row.status === 'submitted') {
        tenderOfferCounts[tid].newCount += 1;
      }
      const submittedAt = row.submitted_at as string | null | undefined;
      if (submittedAt) {
        const prev = tenderLastOfferAt[tid];
        if (!prev || new Date(submittedAt).getTime() > new Date(prev).getTime()) {
          tenderLastOfferAt[tid] = submittedAt;
        }
      }
    }
  }

  const reviewedTenderIds =
    managerUserId && tenderIds.length > 0
      ? await fetchReviewedTenderIdsForReviewer(
          supabase,
          managerUserId,
          tenderIds.filter((id) => tenderHasSelectedOffer[id]),
        )
      : new Set<string>();

  const jobs: ManagerSubmission[] = jobRows.map((j) => ({
    id: j.id,
    kind: 'job' as const,
    title: j.title,
    status: j.status,
    offersCount: jobOfferCounts[j.id]?.total ?? 0,
    newOffersCount: jobOfferCounts[j.id]?.newCount ?? 0,
    lastOfferAt: jobLastOfferAt[j.id] ?? null,
    createdAt: j.created_at,
    canEdit:
      (j.status === 'draft' ||
        j.status === 'active' ||
        j.status === 'collecting_offers') &&
      (jobOfferCounts[j.id]?.total ?? 0) === 0,
    hasSelectedOffer: jobHasSelectedOffer[j.id] ?? false,
    hasCooperationReview: false,
  }));

  const tenders: ManagerSubmission[] = tenderRows.map((t) => ({
    id: t.id,
    kind: 'contest' as const,
    title: t.title,
    status: t.status,
    offersCount: tenderOfferCounts[t.id]?.total ?? 0,
    newOffersCount: tenderOfferCounts[t.id]?.newCount ?? 0,
    lastOfferAt: tenderLastOfferAt[t.id] ?? null,
    createdAt: t.created_at,
    canEdit:
      t.status === 'draft' && (tenderOfferCounts[t.id]?.total ?? 0) === 0,
    hasSelectedOffer: tenderHasSelectedOffer[t.id] ?? false,
    hasCooperationReview: reviewedTenderIds.has(t.id),
  }));

  return [...jobs, ...tenders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
