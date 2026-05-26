import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { isContestTender } from '../tender-contest/map-tender-contest-display';
import { getContestWorkflowStatusLabel } from '../tender-workflow-status';

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

function isContestRow(row: Pick<TenderContestRow, 'building_id' | 'selection_criteria' | 'formal_requirements'>): boolean {
  return isContestTender({
    building_id: row.building_id,
    selection_criteria: row.selection_criteria as Record<string, unknown> | null,
    formal_requirements: row.formal_requirements as Record<string, unknown> | null,
  });
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
    .lt('submission_deadline', now);
}

/**
 * Contest-only list for manager Konkursy tab (OPD-60).
 */
export async function fetchManagerContests(
  supabase: SupabaseClient<Database>,
  companyId: string,
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchManagerContests:', error);
    return [];
  }

  const contestRows = ((tenderRows || []) as TenderContestRow[]).filter(isContestRow);
  const tenderIds = contestRows.map((t) => t.id);

  const offerCounts: Record<string, number> = {};
  const hasSelected: Record<string, boolean> = {};
  const winnerNames: Record<string, string> = {};
  const winnerCompanyIds: Record<string, string> = {};

  if (tenderIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bids } = await (supabase as any)
      .from('tender_bids')
      .select('tender_id, status, company:companies!tender_bids_company_id_fkey (id, name)')
      .in('tender_id', tenderIds);

    for (const row of bids || []) {
      const tid = row.tender_id as string;
      const status = row.status as string;
      if (status === 'submitted' || status === 'under_review' || status === 'shortlisted') {
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
  }));
}

export function getContestStatusLabel(status: string): string {
  return getContestWorkflowStatusLabel(status);
}
