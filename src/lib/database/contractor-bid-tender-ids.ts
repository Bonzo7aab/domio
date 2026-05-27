import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { fetchUserPrimaryCompany } from './companies';

export interface ContractorBidTenderIds {
  submittedTenderIds: string[];
  draftTenderIds: string[];
}

/**
 * Tender IDs where the contractor's company has a non-cancelled bid (draft or submitted).
 */
export async function fetchContractorBidTenderIds(
  supabase: SupabaseClient<Database>,
  contractorUserId: string,
): Promise<ContractorBidTenderIds> {
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(
    supabase,
    contractorUserId,
  );

  if (companyError || !company) {
    return { submittedTenderIds: [], draftTenderIds: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any)
    .from('tender_bids')
    .select('tender_id, status')
    .eq('company_id', company.id)
    .neq('status', 'cancelled');

  if (error) {
    console.error('fetchContractorBidTenderIds:', error);
    return { submittedTenderIds: [], draftTenderIds: [] };
  }

  const submittedTenderIds: string[] = [];
  const draftTenderIds: string[] = [];

  for (const row of rows || []) {
    const tenderId = row.tender_id as string;
    if (row.status === 'draft') {
      draftTenderIds.push(tenderId);
    } else {
      submittedTenderIds.push(tenderId);
    }
  }

  return { submittedTenderIds, draftTenderIds };
}
