import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export type ContestsTableName = 'contests' | 'tenders';
export type ContestOffersTableName = 'contest_offers' | 'tender_bids';
export type ContestIdColumnName = 'contest_id' | 'tender_id';
export type OffersCountColumnName = 'offers_count' | 'bids_count';

let schemaResolved = false;
let legacyContestsSchema = false;

export function isLegacyContestsSchema(): boolean {
  return legacyContestsSchema;
}

export function contestsTable(): ContestsTableName {
  return legacyContestsSchema ? 'tenders' : 'contests';
}

export function contestOffersTable(): ContestOffersTableName {
  return legacyContestsSchema ? 'tender_bids' : 'contest_offers';
}

export function contestIdColumn(): ContestIdColumnName {
  return legacyContestsSchema ? 'tender_id' : 'contest_id';
}

export function offersCountColumn(): OffersCountColumnName {
  return legacyContestsSchema ? 'bids_count' : 'offers_count';
}

/** Legacy `tenders` mixed przetargi with contests; filter only needed there. */
export function shouldApplyContestTendersFilter(tenderScope?: 'contest' | 'all'): boolean {
  return tenderScope === 'contest' && legacyContestsSchema;
}

export function isMissingContestsRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; details?: string };
  if (e.code === 'PGRST205' || e.code === '42P01') return true;
  const msg = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase();
  return (
    msg.includes("'public.contests'") ||
    msg.includes('relation "contests" does not exist') ||
    msg.includes('could not find the table') && msg.includes('contests')
  );
}

export function normalizeContestRow<T extends Record<string, unknown>>(row: T): T {
  if (!legacyContestsSchema) return row;
  const offersCount = row.offers_count ?? row.bids_count;
  return {
    ...row,
    offers_count: typeof offersCount === 'number' ? offersCount : row.offers_count,
  };
}

export function normalizeContestRows<T extends Record<string, unknown>>(rows: T[] | null): T[] {
  if (!rows?.length) return [];
  return rows.map((row) => normalizeContestRow(row));
}

/**
 * Detect whether the connected DB uses migrated `contests` tables or legacy `tenders`.
 * Cached for the lifetime of the process.
 */
let schemaResolvePromise: Promise<void> | null = null;

export async function ensureContestsSchemaResolved(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  if (schemaResolved) return;
  if (schemaResolvePromise) {
    await schemaResolvePromise;
    return;
  }

  schemaResolvePromise = (async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('contests')
      .select('id')
      .limit(1);

    if (error && isMissingContestsRelationError(error)) {
      legacyContestsSchema = true;
    }

    schemaResolved = true;
    schemaResolvePromise = null;
  })();

  await schemaResolvePromise;
}

/** Alias used at data-layer entry points. */
export const getContestsSchemaReady = ensureContestsSchemaResolved;

export function markContestsSchemaFromError(error: PostgrestError | null): void {
  if (error && isMissingContestsRelationError(error) && !legacyContestsSchema) {
    legacyContestsSchema = true;
    schemaResolved = true;
  }
}

/** Reset cached schema (tests only). */
export function resetContestsSchemaCacheForTests(): void {
  schemaResolved = false;
  legacyContestsSchema = false;
  schemaResolvePromise = null;
}

export function contestOfferParentId(row: Record<string, unknown>): string {
  const id = row[contestIdColumn()];
  return typeof id === 'string' ? id : '';
}
