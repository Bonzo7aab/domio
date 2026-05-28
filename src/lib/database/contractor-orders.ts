import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { OrderStatus } from '../order-workflow-status';
import type { ContestOfferVatRate } from '../../types/contest-offer';
import { fetchUserPrimaryCompany } from './companies';
import {
  fetchRawOrdersForContractorCompany,
  loadCompanyNamesById,
  loadProfileContactsById,
  formatProfileContactName,
  parseDecimalAmount,
} from './order-list-queries';

export interface ContractorOrderRow {
  id: string;
  tenderId: string;
  tenderBidId: string;
  title: string;
  investorName: string;
  locationLabel: string;
  workContactName: string;
  workContactPhone: string | null;
  netAmount: number;
  grossAmount: number;
  vatRate: ContestOfferVatRate;
  vatLabel: string;
  completionDeadline: string | null;
  status: OrderStatus;
  managerId: string;
  createdAt: string;
}

function vatLabelFromRate(rate: string): string {
  if (rate === 'zw') return 'ZW';
  if (rate === '8') return '8%';
  return '23%';
}

/**
 * OPD-63: Contractor Zamówienia list.
 */
export async function fetchContractorOrders(
  supabase: SupabaseClient<Database>,
  contractorUserId: string,
): Promise<ContractorOrderRow[]> {
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(
    supabase,
    contractorUserId,
  );

  if (companyError || !company) {
    return [];
  }

  const { data: rows, error } = await fetchRawOrdersForContractorCompany(
    supabase,
    company.id,
  );

  if (error) {
    if (
      error.includes('orders') &&
      (error.includes('does not exist') ||
        error.includes('PGRST205') ||
        error.includes('schema cache'))
    ) {
      console.error(
        'fetchContractorOrders: tabela orders niedostępna — uruchom migrację supabase/migrations/20260528120000_opd63_orders.sql',
        error,
      );
    } else {
      console.error('fetchContractorOrders:', error);
    }
    return [];
  }

  if (rows.length === 0) {
    return [];
  }

  const [companyNames, profiles] = await Promise.all([
    loadCompanyNamesById(
      supabase,
      rows.map((r) => r.manager_company_id),
    ),
    loadProfileContactsById(
      supabase,
      rows.map((r) => r.manager_id),
    ),
  ]);

  return rows.map((row) => {
    const vatRate = (
      row.vat_rate === '8' || row.vat_rate === '23' || row.vat_rate === 'zw'
        ? row.vat_rate
        : '23'
    ) as ContestOfferVatRate;
    const managerProfile = profiles.get(row.manager_id);

    return {
      id: row.id,
      tenderId: row.tender_id,
      tenderBidId: row.tender_bid_id,
      title: row.title,
      investorName: companyNames.get(row.manager_company_id) || '—',
      locationLabel: row.location_label?.trim() || '—',
      workContactName: formatProfileContactName(managerProfile),
      workContactPhone: managerProfile?.phone ?? null,
      netAmount: parseDecimalAmount(row.net_amount),
      grossAmount: parseDecimalAmount(row.gross_amount),
      vatRate,
      vatLabel: vatLabelFromRate(vatRate),
      completionDeadline: row.completion_deadline,
      status: row.status as OrderStatus,
      managerId: row.manager_id,
      createdAt: row.created_at,
    };
  });
}
