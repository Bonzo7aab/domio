import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export interface ManagerReviewListItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  counterpartyName: string;
}

/**
 * Reviews written by the manager (user) about contractor companies.
 */
export async function fetchReviewsWrittenByManagerUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ManagerReviewListItem[]> {
  const { data, error } = await supabase
    .from('company_reviews')
    .select(
      `
      id,
      rating,
      title,
      comment,
      created_at,
      companies!company_reviews_company_id_fkey ( name )
    `,
    )
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const company = row.companies as { name: string } | null;
    return {
      id: row.id,
      rating: row.rating,
      title: row.title || '',
      comment: row.comment || '',
      createdAt: row.created_at,
      counterpartyName: company?.name || 'Wykonawca',
    };
  });
}
