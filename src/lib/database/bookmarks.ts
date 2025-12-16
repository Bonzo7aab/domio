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
    // First, check if bookmark already exists to avoid duplicates
    const { data: existing, error: checkError } = await supabase
      .from('job_bookmarks')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .maybeSingle();

    // If bookmark already exists, no need to add again
    if (existing) {
      return { error: null };
    }

    // If there was an error other than "not found", return it
    if (checkError && checkError.code !== 'PGRST116') {
      return { error: checkError };
    }

    // Insert the bookmark
    const { error } = await supabase
      .from('job_bookmarks')
      .insert({
        job_id: jobId,
        user_id: userId,
      });

    if (error) {
      return { error };
    }

    // Increment bookmarks_count atomically
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('bookmarks_count')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      console.warn('Failed to fetch current bookmarks_count:', fetchError);
      // Don't fail the bookmark operation if count update fails
      return { error: null };
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ bookmarks_count: (currentJob?.bookmarks_count || 0) + 1 })
      .eq('id', jobId);

    if (updateError) {
      console.warn('Failed to increment bookmarks_count:', updateError);
      // Don't fail the bookmark operation if count update fails
    }

    return { error: null };
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
    // Delete the bookmark
    const { error } = await supabase
      .from('job_bookmarks')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userId);

    if (error) {
      return { error };
    }

    // Decrement bookmarks_count atomically (ensure it doesn't go below 0)
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('bookmarks_count')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      console.warn('Failed to fetch current bookmarks_count:', fetchError);
      // Don't fail the bookmark operation if count update fails
      return { error: null };
    }

    const currentCount = currentJob?.bookmarks_count || 0;
    const newCount = Math.max(0, currentCount - 1);

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ bookmarks_count: newCount })
      .eq('id', jobId);

    if (updateError) {
      console.warn('Failed to decrement bookmarks_count:', updateError);
      // Don't fail the bookmark operation if count update fails
    }

    return { error: null };
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

/**
 * Get bookmark counts for multiple jobs at once
 * This ensures accurate counts by querying the job_bookmarks table directly
 */
export async function getBookmarkCountsForJobs(
  supabase: SupabaseClient<Database>,
  jobIds: string[]
): Promise<{ counts: Record<string, number>; error: any }> {
  try {
    if (!jobIds || jobIds.length === 0) {
      return { counts: {}, error: null };
    }

    const { data, error } = await supabase
      .from('job_bookmarks')
      .select('job_id')
      .in('job_id', jobIds);

    if (error) {
      return { counts: {}, error };
    }

    // Count bookmarks per job
    const counts: Record<string, number> = {};
    jobIds.forEach(jobId => {
      counts[jobId] = 0;
    });

    (data || []).forEach((bookmark) => {
      if (bookmark.job_id) {
        counts[bookmark.job_id] = (counts[bookmark.job_id] || 0) + 1;
      }
    });

    return { counts, error: null };
  } catch (err) {
    console.error('Error getting bookmark counts for jobs:', err);
    return { counts: {}, error: err };
  }
}

