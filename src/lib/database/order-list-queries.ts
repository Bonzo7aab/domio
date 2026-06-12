import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

/** Scalar order row from `orders` (no embeds — avoids PostgREST relationship cache issues). */
export interface RawOrderRow {
  id: string;
  contest_id: string;
  contest_offer_id: string;
  title: string;
  location_label: string | null;
  net_amount: string | number;
  gross_amount: string | number;
  vat_rate: string;
  completion_deadline: string | null;
  status: string;
  manager_id: string;
  contractor_id: string;
  manager_company_id: string;
  contractor_company_id: string;
  created_at: string;
}

export function formatPostgrestError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return String(error);
  }
  const e = error as Record<string, unknown>;
  const parts = [e.message, e.details, e.hint, e.code].filter(
    (p) => typeof p === 'string' && p.length > 0,
  ) as string[];
  if (parts.length > 0) return parts.join(' — ');
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown database error';
  }
}

const ORDER_COLUMNS = `
  id,
  contest_id,
  contest_offer_id,
  title,
  location_label,
  net_amount,
  gross_amount,
  vat_rate,
  completion_deadline,
  status,
  manager_id,
  contractor_id,
  manager_company_id,
  contractor_company_id,
  created_at
`;

export async function fetchRawOrdersForManagerCompany(
  supabase: SupabaseClient<Database>,
  managerCompanyId: string,
): Promise<{ data: RawOrderRow[]; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('manager_company_id', managerCompanyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: formatPostgrestError(error) };
  }
  return { data: (data || []) as RawOrderRow[], error: null };
}

export async function fetchRawOrdersForContractorCompany(
  supabase: SupabaseClient<Database>,
  contractorCompanyId: string,
): Promise<{ data: RawOrderRow[]; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('contractor_company_id', contractorCompanyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: formatPostgrestError(error) };
  }
  return { data: (data || []) as RawOrderRow[], error: null };
}

interface CompanyNameRow {
  id: string;
  name: string | null;
}

interface ProfileContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export async function loadCompanyNamesById(
  supabase: SupabaseClient<Database>,
  companyIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(companyIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('companies')
    .select('id, name')
    .in('id', unique);

  if (error) {
    console.warn('loadCompanyNamesById:', formatPostgrestError(error));
    return new Map();
  }

  const map = new Map<string, string>();
  for (const row of (data || []) as CompanyNameRow[]) {
    if (row.name?.trim()) map.set(row.id, row.name.trim());
  }
  return map;
}

export async function loadProfileContactsById(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, ProfileContactRow>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('id, first_name, last_name, phone')
    .in('id', unique);

  if (error) {
    console.warn('loadProfileContactsById:', formatPostgrestError(error));
    return new Map();
  }

  const map = new Map<string, ProfileContactRow>();
  for (const row of (data || []) as ProfileContactRow[]) {
    map.set(row.id, row);
  }
  return map;
}

export function formatProfileContactName(
  profile: ProfileContactRow | undefined,
): string {
  if (!profile) return '—';
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

export function parseDecimalAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isNaN(n) ? 0 : n;
}
