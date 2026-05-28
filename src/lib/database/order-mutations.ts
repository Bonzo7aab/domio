import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import {
  canCancelOrder,
  canContractorReportForAcceptance,
  canManagerAcceptWork,
} from '../order-workflow-status';

export interface OrderMutationResult {
  success: boolean;
  error?: string;
}

async function fetchOrderForMutation(
  supabase: SupabaseClient<Database>,
  orderId: string,
): Promise<{
  id: string;
  status: string;
  manager_company_id: string;
  contractor_company_id: string;
  tender_id: string;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('orders')
    .select('id, status, manager_company_id, contractor_company_id, tender_id')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function reportOrderForAcceptance(
  supabase: SupabaseClient<Database>,
  orderId: string,
  contractorCompanyId: string,
): Promise<OrderMutationResult> {
  const order = await fetchOrderForMutation(supabase, orderId);
  if (!order) {
    return { success: false, error: 'Nie znaleziono zamówienia' };
  }
  if (order.contractor_company_id !== contractorCompanyId) {
    return { success: false, error: 'Brak uprawnień' };
  }
  if (!canContractorReportForAcceptance(order.status)) {
    return { success: false, error: 'Nie można zgłosić tego zamówienia do odbioru' };
  }

  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('orders')
    .update({
      status: 'awaiting_acceptance',
      reported_for_acceptance_at: now,
      updated_at: now,
    })
    .eq('id', orderId)
    .eq('contractor_company_id', contractorCompanyId);

  if (error) {
    return { success: false, error: error.message || 'Nie udało się zaktualizować zamówienia' };
  }
  return { success: true };
}

export async function acceptOrderWork(
  supabase: SupabaseClient<Database>,
  orderId: string,
  managerCompanyId: string,
): Promise<OrderMutationResult> {
  const order = await fetchOrderForMutation(supabase, orderId);
  if (!order) {
    return { success: false, error: 'Nie znaleziono zamówienia' };
  }
  if (order.manager_company_id !== managerCompanyId) {
    return { success: false, error: 'Brak uprawnień' };
  }
  if (!canManagerAcceptWork(order.status)) {
    return { success: false, error: 'Zamówienie nie oczekuje na odbiór' };
  }

  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('orders')
    .update({
      status: 'completed',
      completed_at: now,
      updated_at: now,
    })
    .eq('id', orderId)
    .eq('manager_company_id', managerCompanyId);

  if (error) {
    return { success: false, error: error.message || 'Nie udało się odebrać prac' };
  }
  return { success: true };
}

export async function cancelOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
  managerId: string,
  managerCompanyId: string,
  cancelReason: string,
): Promise<OrderMutationResult> {
  const reason = cancelReason.trim();
  if (!reason) {
    return { success: false, error: 'Podaj powód przerwania zamówienia' };
  }

  const order = await fetchOrderForMutation(supabase, orderId);
  if (!order) {
    return { success: false, error: 'Nie znaleziono zamówienia' };
  }
  if (order.manager_company_id !== managerCompanyId) {
    return { success: false, error: 'Brak uprawnień' };
  }
  if (!canCancelOrder(order.status)) {
    return { success: false, error: 'Tego zamówienia nie można przerwać' };
  }

  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      cancelled_by: managerId,
      cancel_reason: reason,
      updated_at: now,
    })
    .eq('id', orderId)
    .eq('manager_company_id', managerCompanyId);

  if (error) {
    return { success: false, error: error.message || 'Nie udało się przerwać zamówienia' };
  }
  return { success: true };
}

export async function isOrderMessagingBlocked(
  supabase: SupabaseClient<Database>,
  tenderId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('orders')
    .select('status')
    .eq('tender_id', tenderId)
    .maybeSingle();

  if (!data) return false;
  return data.status === 'cancelled';
}
