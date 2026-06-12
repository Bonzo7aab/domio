import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { addBookmark, getBookmarkedJobs, removeBookmark } from '../utils/bookmarkStorage';
import { resolveBookmarkEntityType } from '../lib/bookmark/resolve-entity-type';
import {
  BOOKMARK_COUNT_CHANGED_EVENT,
  readBookmarkCountOverrides,
} from '../utils/bookmarkCountOverrides';
import { getStoredJobs, Job as StorageJob } from '../utils/jobStorage';
import JobCard from './JobCard';
import { FilterState } from './JobFilters';
import { JobListHeader } from './JobListHeader';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { jobMatchesFilters } from '../lib/filters/filter-logic';
import { isJobExpired } from '../utils/jobHelpers';
import type { Job } from '../types/job';
import type { Budget } from '../types/budget';

interface EnhancedJobListProps {
  jobs?: Job[]; // Jobs data from parent
  isLoadingJobs?: boolean; // Loading state from parent
  filters?: FilterState;
  onJobSelect?: (jobId: string) => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
  hoveredJobId?: string | null;
  onJobHover?: (jobId: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  searchRadius?: number;
  onApplyClick?: (jobId: string, jobData?: Job) => void;
  onClearSearch?: () => void;
  onPrimaryLocationChange?: (location: string) => void;
}

export const EnhancedJobList: React.FC<EnhancedJobListProps> = ({
  jobs = [],
  isLoadingJobs = false,
  filters,
  onJobSelect,
  onToggleMap,
  isMapVisible = true,
  hoveredJobId,
  onJobHover,
  userLocation: _userLocation,
  searchRadius: _searchRadius = 25,
  onApplyClick,
  onClearSearch,
  onPrimaryLocationChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [loadedCount, setLoadedCount] = useState(20);
  const [storedJobs, setStoredJobs] = useState<StorageJob[]>([]);
  const [isExpiredJobsOpen, setIsExpiredJobsOpen] = useState(false);
  
  // Load bookmark count updates from sessionStorage on mount
  const [bookmarkCountUpdates, setBookmarkCountUpdates] = useState<Record<string, number>>(
    () => readBookmarkCountOverrides(),
  );
  
  // Load view count updates from sessionStorage on mount
  const [viewCountUpdates, setViewCountUpdates] = useState<Record<string, number>>(() => {
    try {
      const stored = sessionStorage.getItem('view-count-updates');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  useEffect(() => {
    const syncBookmarkCounts = () => {
      setBookmarkCountUpdates(readBookmarkCountOverrides());
    };
    window.addEventListener(BOOKMARK_COUNT_CHANGED_EVENT, syncBookmarkCounts);
    window.addEventListener('focus', syncBookmarkCounts);
    return () => {
      window.removeEventListener(BOOKMARK_COUNT_CHANGED_EVENT, syncBookmarkCounts);
      window.removeEventListener('focus', syncBookmarkCounts);
    };
  }, []);

  // Load view count updates from sessionStorage when jobs change
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('view-count-updates');
      const updates = stored ? JSON.parse(stored) : {};
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setViewCountUpdates(updates);
      }, 0);
    } catch {
      // Ignore errors when loading view count updates
    }
  }, [jobs]);
  
  // Load stored jobs from localStorage (simplified) - fallback
  useEffect(() => {
    try {
      const jobs = getStoredJobs();
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setStoredJobs(jobs);
      }, 0);
    } catch {
      // Ignore errors when loading stored jobs
      setTimeout(() => {
        setStoredJobs([]);
      }, 0);
    }
  }, []);

  // Load bookmarked jobs from localStorage on mount
  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const bookmarks = getBookmarkedJobs();
        const bookmarkedIds = bookmarks.map(b => b.id);
        setBookmarkedJobs(bookmarkedIds);
      } catch {
        // Ignore errors when loading bookmarks
      }
    };

    loadBookmarks();

    // Reload bookmarks when window regains focus (e.g., returning from job page)
    const handleFocus = () => {
      loadBookmarks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  
  // Use jobs from props, fallback to stored jobs if needed, and apply bookmark count updates
  const allJobs = useMemo(() => {
    let jobsToReturn: Job[] = [];
    
    // Collect from all potential sources
    if (jobs && jobs.length > 0) {
      jobsToReturn = [...jobs];
    } else if (!isLoadingJobs) {
      // Use stored jobs as fallback
      jobsToReturn = [...(storedJobs as unknown as Job[])];
    }
    
    // Aggressive deduplication using Map (O(n) instead of O(n²))
    const seen = new Map();
    const uniqueJobs = jobsToReturn.filter(job => {
      if (!job || !job.id) return false; // Skip invalid jobs
      if (seen.has(job.id)) return false; // Already seen
      seen.set(job.id, true);
      return true;
    });
    
    // Apply bookmark and view count updates
    return uniqueJobs.map(job => {
      let updatedJob = { ...job };
      const bookmarkCountUpdate = bookmarkCountUpdates[job.id];
      if (bookmarkCountUpdate !== undefined) {
        updatedJob = { ...updatedJob, bookmarks_count: bookmarkCountUpdate };
      }
      const viewCountUpdate = viewCountUpdates[job.id];
      if (viewCountUpdate !== undefined) {
        updatedJob = { 
          ...updatedJob, 
          visits_count: viewCountUpdate,
          metrics: {
            ...updatedJob.metrics,
            visits: viewCountUpdate,
          },
        };
      }
      return updatedJob;
    });
  }, [jobs, storedJobs, isLoadingJobs, bookmarkCountUpdates, viewCountUpdates]);

  // Simple search functionality (title only)
  const searchFilteredJobs = useMemo(() => {
    // Use search query from filters if available, otherwise fall back to local state
    const activeSearchQuery = filters?.searchQuery || searchQuery;
    
    if (!activeSearchQuery.trim()) return allJobs;

    const query = activeSearchQuery.toLowerCase();
    return allJobs.filter(job => {
      const jobTitle = (job.title || '').toLowerCase();
      return jobTitle.includes(query);
    });
  }, [filters?.searchQuery, searchQuery, allJobs]);

  // Apply basic filters
  const filteredJobs = useMemo(() => {
    const jobsToFilter = searchFilteredJobs;
    
    if (!filters) return jobsToFilter;
    
    return jobsToFilter.filter((job) => jobMatchesFilters(job, filters));
  }, [searchFilteredJobs, filters]);

  // Simple sorting
  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const parseTime = (timeStr: string) => {
            const now = Date.now();
            if (timeStr.includes('godzin')) {
              const hours = parseInt(timeStr);
              return now - (hours * 60 * 60 * 1000);
            } else if (timeStr.includes('dzień') || timeStr.includes('dni')) {
              const days = parseInt(timeStr);
              return now - (days * 24 * 60 * 60 * 1000);
            }
            return now - (60 * 60 * 1000);
          };
          return parseTime(b.postedTime) - parseTime(a.postedTime);
        });
      case 'salary-high':
        return sorted.sort((a, b) => {
          const aMax = (a.budget as { max?: number })?.max || (a.budget as { budget_max?: number })?.budget_max || 0;
          const bMax = (b.budget as { max?: number })?.max || (b.budget as { budget_max?: number })?.budget_max || 0;
          return bMax - aMax;
        });
      case 'salary-low':
        return sorted.sort((a, b) => {
          const aMin = (a.budget as { min?: number })?.min || (a.budget as { budget_min?: number })?.budget_min || 0;
          const bMin = (b.budget as { min?: number })?.min || (b.budget as { budget_min?: number })?.budget_min || 0;
          return aMin - bMin;
        });
      case 'budget':
        return sorted.sort((a, b) => {
          const aBudget = (a.budget as { max?: number; total?: number })?.max || (a.budget as { max?: number; total?: number })?.total || 0;
          const bBudget = (b.budget as { max?: number; total?: number })?.max || (b.budget as { max?: number; total?: number })?.total || 0;
          return bBudget - aBudget;
        });
      case 'applications':
        return sorted.sort((a, b) => {
          const aApplications = a.applications ?? a.metrics?.applications ?? 0;
          const bApplications = b.applications ?? b.metrics?.applications ?? 0;
          return aApplications - bApplications;
        });
      default:
        return sorted;
    }
  }, [filteredJobs, sortBy]);

  // Separate jobs into active and expired
  const { activeJobs, expiredJobs } = useMemo(() => {
    const active: Job[] = [];
    const expired: Job[] = [];
    
    sortedJobs.forEach(job => {
      if (isJobExpired(job)) {
        expired.push(job);
      } else {
        active.push(job);
      }
    });
    
    return { activeJobs: active, expiredJobs: expired };
  }, [sortedJobs]);

  // Get displayed jobs with simple pagination (only active jobs)
  const displayedActiveJobs = activeJobs.slice(0, loadedCount);

  // Determine primary location for dynamic title
  const primaryLocation = useMemo(() => {
    if (!filteredJobs.length) return 'Polska';
    
    const locations = filteredJobs.map(job => job.location);
    const locationCounts = locations.reduce((acc, location) => {
      const key = typeof location === 'string' ? location : (location as { city?: string }).city || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number));
    
    if (sortedLocations.length === 1) {
      return sortedLocations[0][0];
    } else if (sortedLocations.length > 1) {
      const count1 = sortedLocations[0][1] as number;
      const count2 = sortedLocations[1][1] as number;
      if (count1 > count2 * 1.5) {
        return sortedLocations[0][0];
      }
    }
    
    return 'Polski';
  }, [filteredJobs]);

  const selectedPostTypes = filters?.postTypes || [];

  // Notify parent of primary location changes
  useEffect(() => {
    if (onPrimaryLocationChange) {
      onPrimaryLocationChange(primaryLocation);
    }
  }, [primaryLocation, onPrimaryLocationChange]);

  const handleJobSelect = useCallback((jobId: string) => {
    onJobSelect?.(jobId);
  }, [onJobSelect]);

  const handleJobHover = useCallback((jobId: string | null) => {
    onJobHover?.(jobId);
  }, [onJobHover]);

  const handleBookmark = useCallback((jobId: string, job: Job) => {
    const isCurrentlyBookmarked = bookmarkedJobs.includes(jobId);
    const currentCount = job.bookmarks_count || 0;
    const entityType = resolveBookmarkEntityType({
      postType: job.postType,
      contestInfo: job.contestInfo,
    });
    const isJobEntity = entityType === 'job';
    const countBaseline = isJobEntity ? currentCount : undefined;
    
    if (isCurrentlyBookmarked) {
      void removeBookmark(jobId, entityType, undefined, undefined, countBaseline);
      setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
    } else {
      const bookmarkData = {
        id: job.id,
        entityType,
        title: job.title,
        company: job.company,
        location: job.location,
        postType: (job.postType || 'job') as 'job' | 'contest',
        budget: typeof job.budget === 'object' ? job.budget : {
          min: null,
          max: null,
          type: 'negotiable',
          currency: 'PLN',
        },
        deadline: job.deadline
      };
      void addBookmark(
        {
          ...bookmarkData,
          budget:
            typeof bookmarkData.budget === 'object' &&
            'min' in bookmarkData.budget &&
            'max' in bookmarkData.budget
              ? (bookmarkData.budget as Budget)
              : String(bookmarkData.budget || ''),
        },
        undefined,
        undefined,
        countBaseline,
      );
      setBookmarkedJobs(prev => [...prev, jobId]);
    }
  }, [bookmarkedJobs]);

  const handleLoadMore = useCallback(() => {
    setLoadedCount(prev => prev + 10);
  }, []);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Job List Header */}
          <div className="p-4 pb-0">
            <JobListHeader 
              totalResults={allJobs.length}
              filteredResults={activeJobs.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
              isMapVisible={isMapVisible}
              onToggleMap={onToggleMap || (() => {})}
              searchQuery={filters?.searchQuery || searchQuery}
              primaryLocation={primaryLocation}
              selectedPostTypes={selectedPostTypes}
            />
          </div>

          {/* Jobs List */}
          <div className="p-4 space-y-3">
            {isLoadingJobs ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">Ładowanie ogłoszeń...</div>
                {jobs.length > 0 && (
                  <Badge variant="outline" className="text-xs mt-2">
                    Pobrano {jobs.length} ogłoszeń z bazy danych
                  </Badge>
                )}
              </div>
            ) : displayedActiveJobs.length === 0 && expiredJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">Brak wyników</div>
                <div className="text-sm text-muted-foreground">
                  Nie znaleziono ogłoszeń spełniających wybrane kryteria
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    // Clear search query in filters as well
                    if (filters) {
                      // This would need to be handled by parent component
                      // For now just clear local state
                    }
                    if (onClearSearch) {
                      onClearSearch();
                    }
                  }}
                >
                  Wyczyść wyszukiwanie
                </Button>
              </div>
            ) : (
              <>
                {/* Active Jobs */}
                {displayedActiveJobs.map((job, index) => (
                  <JobCard
                    key={job.id || `fallback-${index}`}
                    job={job}
                    onClick={() => handleJobSelect(job.id)}
                    onMouseEnter={() => handleJobHover(job.id)}
                    onMouseLeave={() => handleJobHover(null)}
                    isHighlighted={hoveredJobId === job.id}
                    isBookmarked={bookmarkedJobs.includes(job.id)}
                    onBookmark={() => handleBookmark(job.id, job)}
                    onApplyClick={onApplyClick}
                    isExpired={false}
                  />
                ))}

                {/* Load More Button for Active Jobs */}
                {activeJobs.length > loadedCount && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore}
                    >
                      Załaduj więcej ogłoszeń
                    </Button>
                  </div>
                )}

                {/* Expired Jobs Section */}
                {expiredJobs.length > 0 && (
                  <div className="mt-8">
                    <Collapsible open={isExpiredJobsOpen} onOpenChange={setIsExpiredJobsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-0 h-auto hover:bg-transparent mb-4"
                        >
                          <h3 className="text-base sm:text-lg font-semibold text-gray-600">
                            Wygasłe zgłoszenia ({expiredJobs.length})
                          </h3>
                          {isExpiredJobsOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {expiredJobs.map((job, index) => (
                          <JobCard
                            key={job.id || `expired-fallback-${index}`}
                            job={job}
                            onClick={() => handleJobSelect(job.id)}
                            onMouseEnter={() => handleJobHover(job.id)}
                            onMouseLeave={() => handleJobHover(null)}
                            isHighlighted={hoveredJobId === job.id}
                            isBookmarked={bookmarkedJobs.includes(job.id)}
                            onBookmark={() => handleBookmark(job.id, job)}
                            onApplyClick={onApplyClick}
                            isExpired={true}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};