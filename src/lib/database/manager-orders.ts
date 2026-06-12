import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { OrderStatus } from '../order-workflow-status';
import {
  fetchRawOrdersForManagerCompany,
  loadCompanyNamesById,
  loadProfileContactsById,
  formatProfileContactName,
  parseDecimalAmount,
} from './order-list-queries';

export interface ManagerOrderRow {
  id: string;
  tenderId: string;
  tenderBidId: string;
  title: string;
  locationLabel: string;
  contractorCompanyId: string;
  contractorCompanyName: string;
  contractorContactName: string;
  contractorContactPhone: string | null;
  netAmount: number;
  grossAmount: number;
  vatRate: string;
  completionDeadline: string | null;
  status: OrderStatus;
  contractorId: string;
  managerId: string;
  createdAt: string;
}

/**
 * OPD-63: Manager Zamówienia list.
 */
export async function fetchManagerOrders(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<ManagerOrderRow[]> {
  const { data: rows, error } = await fetchRawOrdersForManagerCompany(
    supabase,
    companyId,
  );

  if (error) {
    if (
      error.includes('orders') &&
      (error.includes('does not exist') ||
        error.includes('PGRST205') ||
        error.includes('schema cache'))
    ) {
      console.error(
        'fetchManagerOrders: tabela orders niedostępna — uruchom migrację supabase/migrations/20260528120000_opd63_orders.sql',
        error,
      );
    } else {
      console.error('fetchManagerOrders:', error);
    }
    return [];
  }

  if (rows.length === 0) {
    return [];
  }

  const [companyNames, profiles] = await Promise.all([
    loadCompanyNamesById(
      supabase,
      rows.map((r) => r.contractor_company_id),
    ),
    loadProfileContactsById(
      supabase,
      rows.map((r) => r.contractor_id),
    ),
  ]);

  return rows.map((row) => {
    const contractorProfile = profiles.get(row.contractor_id);

    return {
      id: row.id,
      tenderId: row.contest_id,
      tenderBidId: row.contest_offer_id,
      title: row.title,
      locationLabel: row.location_label?.trim() || '—',
      contractorCompanyId: row.contractor_company_id,
      contractorCompanyName: companyNames.get(row.contractor_company_id) || '—',
      contractorContactName: formatProfileContactName(contractorProfile),
      contractorContactPhone: contractorProfile?.phone ?? null,
      netAmount: parseDecimalAmount(row.net_amount),
      grossAmount: parseDecimalAmount(row.gross_amount),
      vatRate: row.vat_rate,
      completionDeadline: row.completion_deadline,
      status: row.status as OrderStatus,
      contractorId: row.contractor_id,
      managerId: row.manager_id,
      createdAt: row.created_at,
    };
  });
}

export async function fetchManagerOrderById(
  supabase: SupabaseClient<Database>,
  orderId: string,
  companyId: string,
): Promise<ManagerOrderRow | null> {
  const rows = await fetchManagerOrders(supabase, companyId);
  return rows.find((r) => r.id === orderId) ?? null;
}
