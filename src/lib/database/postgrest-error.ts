import type { PostgrestError } from '@supabase/supabase-js';

export function formatPostgrestError(error: PostgrestError | null | undefined): string {
  if (!error) return 'Nieznany błąd';
  const parts = [error.message, error.details, error.hint, error.code].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : 'Nieznany błąd bazy danych';
}
