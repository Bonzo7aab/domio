import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

/**
 * Add a bookmark for a job
 */
export async function addJobBookmark(
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('job_bookmarks')
      .insert({
        job_id: jobId,
        user_id: userId,
      });

    return { error };
  } catch (err) {
    console.error('Error adding job bookmark:', err);
    return { error: err };
  }
}

/**
 * Remove a bookmark for a job
 */
export async function removeJobBookmark(
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('job_bookmarks')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userId);

    return { error };
  } catch (err) {
    console.error('Error removing job bookmark:', err);
    return { error: err };
  }
}

/**
 * Check if a job is bookmarked by a user
 */
export async function isJobBookmarked(
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string
): Promise<{ bookmarked: boolean; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_bookmarks')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected when not bookmarked
      return { bookmarked: false, error };
    }

    return { bookmarked: !!data, error: null };
  } catch (err) {
    console.error('Error checking job bookmark:', err);
    return { bookmarked: false, error: err };
  }
}

/**
 * Get bookmarks count for a job
 */
export async function getJobBookmarksCount(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await supabase
      .from('job_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    return { count: count || 0, error };
  } catch (err) {
    console.error('Error getting job bookmarks count:', err);
    return { count: 0, error: err };
  }
}

/**
 * Get all bookmarked job IDs for a user
 */
export async function getUserBookmarkedJobIds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ jobIds: string[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_bookmarks')
      .select('job_id')
      .eq('user_id', userId);

    if (error) {
      return { jobIds: [], error };
    }

    const jobIds = (data || []).map((bookmark) => bookmark.job_id);
    return { jobIds, error: null };
  } catch (err) {
    console.error('Error getting user bookmarked jobs:', err);
    return { jobIds: [], error: err };
  }
}

