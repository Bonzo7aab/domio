// Utility functions for managing bookmarked jobs in localStorage
// Optionally syncs with database when user is authenticated

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { addJobBookmark as addJobBookmarkDb, removeJobBookmark as removeJobBookmarkDb } from '../lib/database/bookmarks';
import type { Budget } from '../types/budget';

export interface BookmarkedJob {
  id: string;
  title: string;
  company: string;
  location: string | { city?: string; sublocality_level_1?: string };
  postType: 'job' | 'tender';
  bookmarkedAt: string;
  budget?: string | Budget;
  deadline?: string;
}

const BOOKMARKS_KEY = 'urbi-bookmarked-jobs';

export const getBookmarkedJobs = (): BookmarkedJob[] => {
  try {
    const bookmarks = localStorage.getItem(BOOKMARKS_KEY);
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    console.error('Error loading bookmarked jobs:', error);
    return [];
  }
};

export const addBookmark = async (
  job: Omit<BookmarkedJob, 'bookmarkedAt'>,
  supabase?: SupabaseClient<Database>,
  userId?: string
): Promise<void> => {
  try {
    // Sync with database if authenticated
    if (supabase && userId) {
      const { error } = await addJobBookmarkDb(supabase, job.id, userId);
      if (error) {
        console.warn('Failed to sync bookmark with database:', error);
        // Continue with localStorage as fallback
      }
    }

    // Always update localStorage for offline/unauthenticated users
    const bookmarks = getBookmarkedJobs();
    const newBookmark: BookmarkedJob = {
      ...job,
      bookmarkedAt: new Date().toISOString()
    };
    
    // Remove existing bookmark if it exists
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== job.id);
    
    // Add new bookmark at the beginning
    const updatedBookmarks = [newBookmark, ...filteredBookmarks];
    
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
    console.log('✅ Job bookmarked:', job.id);
  } catch (error) {
    console.error('Error adding bookmark:', error);
  }
};

export const removeBookmark = async (
  jobId: string,
  supabase?: SupabaseClient<Database>,
  userId?: string
): Promise<void> => {
  try {
    // Sync with database if authenticated
    if (supabase && userId) {
      const { error } = await removeJobBookmarkDb(supabase, jobId, userId);
      if (error) {
        console.warn('Failed to sync bookmark removal with database:', error);
        // Continue with localStorage as fallback
      }
    }

    // Always update localStorage for offline/unauthenticated users
    const bookmarks = getBookmarkedJobs();
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== jobId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
    console.log('✅ Bookmark removed:', jobId);
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
};

export const isJobBookmarked = (jobId: string): boolean => {
  try {
    const bookmarks = getBookmarkedJobs();
    return bookmarks.some(bookmark => bookmark.id === jobId);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

export const clearAllBookmarks = (): void => {
  try {
    localStorage.removeItem(BOOKMARKS_KEY);
    console.log('✅ All bookmarks cleared');
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
  }
};