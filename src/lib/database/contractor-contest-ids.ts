import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { fetchUserPrimaryCompany } from './companies';

export interface ContractorContestIds {
  submittedContestIds: string[];
  draftContestIds: string[];
}

/**
 * Contest IDs where the contractor's company has a non-cancelled offer (draft or submitted).
 */
export async function fetchContractorContestIds(
  supabase: SupabaseClient<Database>,
  contractorUserId: string,
): Promise<ContractorContestIds> {
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(
    supabase,
    contractorUserId,
  );

  if (companyError || !company) {
    return { submittedContestIds: [], draftContestIds: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any)
    .from('contest_offers')
    .select('contest_id, status')
    .eq('company_id', company.id)
    .neq('status', 'cancelled');

  if (error) {
    console.error('fetchContractorContestIds:', error);
    return { submittedContestIds: [], draftContestIds: [] };
  }

  const submittedContestIds: string[] = [];
  const draftContestIds: string[] = [];

  for (const row of rows || []) {
    const contestId = row.contest_id as string;
    if (row.status === 'draft') {
      draftContestIds.push(contestId);
    } else {
      submittedContestIds.push(contestId);
    }
  }

  return { submittedContestIds, draftContestIds };
}

/** @deprecated Use fetchContractorContestIds */
export async function fetchContractorBidTenderIds(
  supabase: SupabaseClient<Database>,
  contractorUserId: string,
): Promise<{ submittedTenderIds: string[]; draftTenderIds: string[] }> {
  const { submittedContestIds, draftContestIds } = await fetchContractorContestIds(
    supabase,
    contractorUserId,
  );
  return {
    submittedTenderIds: submittedContestIds,
    draftTenderIds: draftContestIds,
  };
}
