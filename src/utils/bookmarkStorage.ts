// Utility functions for managing bookmarked jobs in localStorage

export interface BookmarkedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  postType: 'job' | 'tender';
  bookmarkedAt: string;
  budget?: string;
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

export const addBookmark = (job: Omit<BookmarkedJob, 'bookmarkedAt'>): void => {
  try {
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

export const removeBookmark = (jobId: string): void => {
  try {
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