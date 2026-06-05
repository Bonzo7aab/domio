import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { CONTEST_TENDERS_OR_FILTER } from './jobs';
import { getContestWorkflowStatusLabel } from '../tender-workflow-status';
import {
  fetchContestCommentCounts,
  fetchContestQuestionCounts,
  fetchUnansweredContestQuestionCounts,
  fetchUnseenContestQuestionCounts,
} from './questions';
import { countsTowardTenderBidsCount } from './tender-bid-count';
import { fetchReviewedTenderIdsForReviewer } from './reviews';

export interface ManagerContest {
  id: string;
  title: string;
  locationLabel: string;
  submissionDeadline: string;
  status: string;
  offersCount: number;
  hasSelectedOffer: boolean;
  canEdit: boolean;
  selectedContractorName?: string;
  selectedContractorCompanyId?: string;
  createdAt: string;
  /** Unanswered questions not yet opened by manager in Q&A dialog */
  unseenQuestionsCount: number;
  /** Total questions awaiting manager answer */
  unansweredQuestionsCount: number;
  /** All Q&A threads on this contest */
  questionsCount: number;
  /** Published manager comments on contest questions */
  commentsCount: number;
  /** Manager already submitted cooperation review for selected offer */
  hasCooperationReview: boolean;
}

interface TenderContestRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  submission_deadline: string;
  building_id: string | null;
  selection_criteria: unknown;
  formal_requirements: unknown;
  address?: string | null;
  building?: {
    name?: string | null;
    street_address?: string | null;
    city?: string | null;
  } | null;
}

function formatLocationLabel(row: TenderContestRow): string {
  const building = row.building;
  if (building?.street_address || building?.city) {
    const parts = [building.street_address, building.city].filter(Boolean);
    return parts.join(', ');
  }
  if (row.address?.trim()) return row.address.trim();
  if (building?.name?.trim()) return building.name.trim();
  return '—';
}

/**
 * Moves contests past submission deadline from active → evaluation.
 */
export async function advanceContestsPastSubmissionDeadline(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<void> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('tenders')
    .update({ status: 'evaluation', updated_at: now })
    .eq('company_id', companyId)
    .eq('status', 'active')
    .or(CONTEST_TENDERS_OR_FILTER)
    .lt('submission_deadline', now);
}

/**
 * Contest-only list for manager Konkursy tab (OPD-60).
 */
export async function fetchManagerContests(
  supabase: SupabaseClient<Database>,
  companyId: string,
  managerUserId?: string,
): Promise<ManagerContest[]> {
  await advanceContestsPastSubmissionDeadline(supabase, companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenderRows, error } = await (supabase as any)
    .from('tenders')
    .select(
      `
      id,
      title,
      status,
      created_at,
      submission_deadline,
      building_id,
      selection_criteria,
      formal_requirements,
      address,
      building:buildings!tenders_building_id_fkey (
        name,
        street_address,
        city
      )
    `,
    )
    .eq('company_id', companyId)
    .or(CONTEST_TENDERS_OR_FILTER)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchManagerContests:', error);
    return [];
  }

  const contestRows = (tenderRows || []) as TenderContestRow[];
  const tenderIds = contestRows.map((t) => t.id);

  const offerCounts: Record<string, number> = {};
  const hasSelected: Record<string, boolean> = {};
  const winnerNames: Record<string, string> = {};
  const winnerCompanyIds: Record<string, string> = {};

  if (tenderIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bids } = await (supabase as any)
      .from('tender_bids')
      .select(
        'tender_id, status, admin_moderation_status, company:companies!tender_bids_company_id_fkey (id, name)',
      )
      .in('tender_id', tenderIds);

    for (const row of bids || []) {
      const tid = row.tender_id as string;
      const status = row.status as string;
      const moderationStatus = row.admin_moderation_status as string | null | undefined;
      if (
        countsTowardTenderBidsCount(status) &&
        moderationStatus !== 'suspended'
      ) {
        offerCounts[tid] = (offerCounts[tid] ?? 0) + 1;
      }
      if (status === 'accepted') {
        hasSelected[tid] = true;
        const company = row.company as { id?: string; name?: string } | null;
        if (company?.name) winnerNames[tid] = company.name;
        if (company?.id) winnerCompanyIds[tid] = company.id;
      }
    }
  }

  const [unseenCounts, unansweredCounts, questionCounts, commentCounts] =
    tenderIds.length > 0
      ? await Promise.all([
          fetchUnseenContestQuestionCounts(supabase, tenderIds),
          fetchUnansweredContestQuestionCounts(supabase, tenderIds),
          fetchContestQuestionCounts(supabase, tenderIds),
          fetchContestCommentCounts(supabase, tenderIds),
        ])
      : [{}, {}, {}, {}];

  const reviewedTenderIds =
    managerUserId && tenderIds.length > 0
      ? await fetchReviewedTenderIdsForReviewer(
          supabase,
          managerUserId,
          tenderIds.filter((id) => hasSelected[id]),
        )
      : new Set<string>();

  return contestRows.map((t) => ({
    id: t.id,
    title: t.title,
    locationLabel: formatLocationLabel(t),
    submissionDeadline: t.submission_deadline,
    status: t.status,
    offersCount: offerCounts[t.id] ?? 0,
    hasSelectedOffer: hasSelected[t.id] ?? false,
    canEdit: t.status === 'draft',
    selectedContractorName: winnerNames[t.id],
    selectedContractorCompanyId: winnerCompanyIds[t.id],
    createdAt: t.created_at,
    unseenQuestionsCount: unseenCounts[t.id] ?? 0,
    unansweredQuestionsCount: unansweredCounts[t.id] ?? 0,
    questionsCount: questionCounts[t.id] ?? 0,
    commentsCount: commentCounts[t.id] ?? 0,
    hasCooperationReview: reviewedTenderIds.has(t.id),
  }));
}

export function getContestStatusLabel(status: string): string {
  return getContestWorkflowStatusLabel(status);
}

export async function deleteManagerContestDraft(
  supabase: SupabaseClient<Database>,
  params: {
    tenderId: string;
    managerId: string;
    companyId: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const tenderId = params.tenderId.trim();
  if (!tenderId) {
    return { success: false, error: 'Nieprawidłowe dane' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tender, error: fetchErr } = await (supabase as any)
    .from('tenders')
    .select('id, status, manager_id, company_id')
    .eq('id', tenderId)
    .maybeSingle();

  if (fetchErr || !tender) {
    return { success: false, error: 'Nie znaleziono konkursu' };
  }

  if (tender.manager_id !== params.managerId || tender.company_id !== params.companyId) {
    return { success: false, error: 'Brak uprawnień' };
  }

  if (tender.status !== 'draft') {
    return { success: false, error: 'Tylko szkic konkursu można odrzucić' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: bidCount, error: countErr } = await (supabase as any)
    .from('tender_bids')
    .select('*', { count: 'exact', head: true })
    .eq('tender_id', tenderId)
    .neq('status', 'draft')
    .neq('status', 'cancelled');

  if (countErr) {
    return { success: false, error: countErr.message || 'Nie udało się sprawdzić ofert' };
  }

  if ((bidCount ?? 0) > 0) {
    return { success: false, error: 'Nie można odrzucić szkicu — konkurs ma już złożone oferty' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteErr } = await (supabase as any)
    .from('tenders')
    .delete()
    .eq('id', tenderId);

  if (deleteErr) {
    return { success: false, error: deleteErr.message || 'Nie udało się odrzucić szkicu konkursu' };
  }

  return { success: true };
}
