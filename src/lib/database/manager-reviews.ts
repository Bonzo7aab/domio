import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { fetchReviewsWrittenByUser, type WrittenReviewListItem } from './reviews';

export interface ManagerReviewListItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls: string[];
  createdAt: string;
  counterpartyName: string;
  jobId: string | null;
}

function mapWrittenReview(row: WrittenReviewListItem): ManagerReviewListItem {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    imageUrls: row.imageUrls,
    createdAt: row.createdAt,
    counterpartyName: row.counterpartyName,
    jobId: row.jobId,
  };
}

/**
 * Reviews written by the manager (user) about contractor companies.
 */
export async function fetchReviewsWrittenByManagerUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ManagerReviewListItem[]> {
  const rows = await fetchReviewsWrittenByUser(supabase, userId);
  return rows.map(mapWrittenReview);
}
