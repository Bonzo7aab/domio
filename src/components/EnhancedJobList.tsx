import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { addBookmark, getBookmarkedJobs, removeBookmark } from '../utils/bookmarkStorage';
import { getStoredJobs, Job as StorageJob } from '../utils/jobStorage';
import JobCard from './JobCard';
import { FilterState } from './JobFilters';
import { JobListHeader } from './JobListHeader';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { extractCity, extractSublocality, getProvinceForCity } from '../utils/locationMapping';
import { isTenderEndingSoon } from '../utils/tenderHelpers';
import { isJobExpired } from '../utils/jobHelpers';
import type { Job } from '../types/job';

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
  userLocation,
  searchRadius = 25,
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
  const [bookmarkCountUpdates, setBookmarkCountUpdates] = useState<Record<string, number>>(() => {
    try {
      const stored = sessionStorage.getItem('bookmark-count-updates');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  // Persist bookmark count updates to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('bookmark-count-updates', JSON.stringify(bookmarkCountUpdates));
    } catch (error) {
      console.error('Error saving bookmark count updates:', error);
    }
  }, [bookmarkCountUpdates]);
  
  // Load stored jobs from localStorage (simplified) - fallback
  useEffect(() => {
    try {
      const jobs = getStoredJobs();
      setStoredJobs(jobs);
    } catch (error) {
      console.error('Error loading stored jobs:', error);
      setStoredJobs([]);
    }
  }, []);

  // Load bookmarked jobs from localStorage on mount
  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const bookmarks = getBookmarkedJobs();
        const bookmarkedIds = bookmarks.map(b => b.id);
        setBookmarkedJobs(bookmarkedIds);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
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
  
  // Merge bookmark count updates with fresh server data
  // Keep optimistic updates but update with server data if it's higher (to handle other users' bookmarks)
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setBookmarkCountUpdates(prev => {
        const newUpdates: Record<string, number> = { ...prev };
        // Update counts from server data, but keep optimistic updates if they're higher
        // This ensures user's actions are reflected while also showing other users' bookmarks
        jobs.forEach(job => {
          const serverCount = (job as any).bookmarks_count || 0;
          const optimisticCount = prev[job.id];
          
          if (optimisticCount !== undefined) {
            // Keep the optimistic count if it's higher (user just bookmarked)
            // Otherwise use server count (which includes other users' bookmarks)
            newUpdates[job.id] = Math.max(optimisticCount, serverCount);
          } else if (serverCount > 0) {
            // No optimistic update, but server has a count - use it
            // Don't set it here, let it come from props naturally
          }
        });
        return newUpdates;
      });
    }
  }, [jobs]);

  // Use jobs from props, fallback to stored jobs if needed, and apply bookmark count updates
  const allJobs = useMemo(() => {
    let jobsToReturn: any[] = [];
    
    // Collect from all potential sources
    if (jobs && jobs.length > 0) {
      jobsToReturn = [...jobs];
    } else if (!isLoadingJobs) {
      // Use stored jobs as fallback
      jobsToReturn = [...storedJobs];
    }
    
    // Aggressive deduplication using Map (O(n) instead of O(n²))
    const seen = new Map();
    const uniqueJobs = jobsToReturn.filter(job => {
      if (!job || !job.id) return false; // Skip invalid jobs
      if (seen.has(job.id)) return false; // Already seen
      seen.set(job.id, true);
      return true;
    });
    
    // Apply bookmark count updates
    return uniqueJobs.map(job => {
      const countUpdate = bookmarkCountUpdates[job.id];
      if (countUpdate !== undefined) {
        return { ...job, bookmarks_count: countUpdate };
      }
      return job;
    });
  }, [jobs, storedJobs, isLoadingJobs, bookmarkCountUpdates]);

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
    let jobsToFilter = searchFilteredJobs;
    
    if (!filters) return jobsToFilter;
    
    return jobsToFilter.filter(job => {
      // Filter by post type (job vs tender)
      if (filters.postTypes && filters.postTypes.length > 0) {
        const jobPostType = job.postType || 'job';
        if (filters.postTypes.length === 2 && filters.postTypes.includes('job') && filters.postTypes.includes('tender')) {
          // Show all posts
        } else if (!filters.postTypes.includes(jobPostType)) {
          return false;
        }
      }
      
      // Filter by subcategories
      if (filters.subcategories && filters.subcategories.length > 0 && !filters.subcategories.includes(job.subcategory)) {
        return false;
      }
      
      // Filter by contract types
      if (filters.contractTypes && filters.contractTypes.length > 0 && !filters.contractTypes.includes(job.type)) {
        return false;
      }
      
      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        const jobCategory = typeof job.category === 'string' 
          ? job.category 
          : (job.category?.name || 'Inne');
        if (!filters.categories.includes(jobCategory)) {
          return false;
        }
      }
      
      // Filter by cities and sublocalities
      if ((filters.cities && filters.cities.length > 0) || (filters.sublocalities && filters.sublocalities.length > 0)) {
        const jobCity = extractCity(job.location);
        const jobSublocality = extractSublocality(job.location);
        
        // If sublocalities are selected, prioritize sublocality matching
        if (filters.sublocalities && filters.sublocalities.length > 0) {
          const matchesSublocality = filters.sublocalities.some(sublocalityKey => {
            const [filterCity, filterSublocality] = sublocalityKey.split(':');
            return jobCity === filterCity && jobSublocality === filterSublocality;
          });
          
          if (matchesSublocality) {
            // Job matches a selected sublocality, include it
            // Continue to next filter check
          } else {
            // Check if city is explicitly selected (not just auto-selected via sublocality)
            // Get cities that have selected sublocalities
            const citiesWithSelectedSublocalities = new Set(
              filters.sublocalities.map(s => s.split(':')[0])
            );
            
            // If city is selected AND doesn't have any selected sublocalities, include all jobs in that city
            // Otherwise, exclude jobs that don't match sublocalities
            const cityExplicitlySelected = filters.cities && filters.cities.some(city => 
              city === jobCity && !citiesWithSelectedSublocalities.has(city)
            );
            
            if (cityExplicitlySelected) {
              // City is selected without sublocalities, include all jobs in city
              // Continue to next filter check
            } else {
              // No match, exclude job
              return false;
            }
          }
        } else if (filters.cities && filters.cities.length > 0) {
          // Only cities selected, no sublocalities
          if (!jobCity || !filters.cities.includes(jobCity)) {
            return false;
          }
        }
      }

      // Filter by provinces
      if (filters.provinces && filters.provinces.length > 0) {
        const jobCity = extractCity(job.location);
        const jobProvince = jobCity ? getProvinceForCity(jobCity) : null;
        if (!jobProvince || !filters.provinces.includes(jobProvince)) {
          return false;
        }
      }

      // Legacy location filter support
      if (filters.locations && filters.locations.length > 0) {
        const jobLocationString = typeof job.location === 'string' ? job.location : job.location?.city || '';
        if (!filters.locations.includes(jobLocationString)) {
          return false;
        }
      }
      
      // Filter by client types
      if (filters.clientTypes && filters.clientTypes.length > 0 && !filters.clientTypes.includes(job.clientType)) {
        return false;
      }

      // Filter by urgency
      if (filters.urgency && filters.urgency.length > 0) {
        if (!filters.urgency.includes(job.urgency)) {
          return false;
        }
      }

      // Filter by ending soon (tenders ending in less than 7 days)
      if (filters.endingSoon && job.postType === 'tender' && job.tenderInfo?.submissionDeadline) {
        if (!isTenderEndingSoon(new Date(job.tenderInfo.submissionDeadline))) {
          return false;
        }
      }
      
      // Filter by budget ranges (checkboxes)
      if (filters.budgetRanges && filters.budgetRanges.length > 0) {
        const jobBudgetMin = (job as any).budget_min;
        const jobBudgetMax = (job as any).budget_max;
        
        // Check if job has budget info (null/undefined check, but 0 is valid)
        const hasBudgetMin = jobBudgetMin != null && jobBudgetMin !== undefined;
        const hasBudgetMax = jobBudgetMax != null && jobBudgetMax !== undefined;
        
        // If job has no budget info, skip budget range filtering (include the job)
        if (!hasBudgetMin && !hasBudgetMax) {
          // Job has no budget, skip range filtering
        } else {
          // Use actual min/max values, handling nulls appropriately
          // If max is null, use min as both min and max (single value)
          // If min is null but max exists, use 0 as min
          const min = hasBudgetMin ? Number(jobBudgetMin) : (hasBudgetMax ? 0 : 0);
          const max = hasBudgetMax ? Number(jobBudgetMax) : (hasBudgetMin ? Number(jobBudgetMin) : Infinity);

          let matchesRange = false;
          for (const range of filters.budgetRanges) {
            if (range === '<5000') {
              // Match if job's max budget is less than 5000
              if (max < 5000) {
                matchesRange = true;
                break;
              }
            } else if (range === '5000-20000') {
              // Match if job's budget range overlaps with 5000-20000
              // Overlap occurs when: min <= 20000 AND max >= 5000
              if (min <= 20000 && max >= 5000) {
                matchesRange = true;
                break;
              }
            } else if (range === '20000+') {
              // Match if job's min budget is >= 20000
              if (min >= 20000) {
                matchesRange = true;
                break;
              }
            }
          }
          
          if (!matchesRange) {
            return false;
          }
        }
      }

      // Filter by budget min/max inputs
      if (filters.budgetMin !== undefined && filters.budgetMin !== null) {
        const jobBudgetMin = (job as any).budget_min ?? null;
        const jobBudgetMax = (job as any).budget_max ?? null;
        
        // If job has no budget info, skip this filter (include the job)
        if (jobBudgetMin === null && jobBudgetMax === null) {
          // Skip filter
        } else {
          // Job must have budget_max >= filters.budgetMin (or budget_min if max is null)
          const jobMaxBudget = jobBudgetMax ?? jobBudgetMin ?? 0;
          if (jobMaxBudget < filters.budgetMin) {
            return false;
          }
        }
      }

      if (filters.budgetMax !== undefined && filters.budgetMax !== null) {
        const jobBudgetMin = (job as any).budget_min ?? null;
        const jobBudgetMax = (job as any).budget_max ?? null;
        
        // If job has no budget info, skip this filter (include the job)
        if (jobBudgetMin === null && jobBudgetMax === null) {
          // Skip filter
        } else {
          // Job must have budget_min <= filters.budgetMax (or budget_max if min is null)
          const jobMinBudget = jobBudgetMin ?? jobBudgetMax ?? 0;
          if (jobMinBudget > filters.budgetMax) {
            return false;
          }
        }
      }
      
      return true;
    });
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
        return sorted.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
      case 'salary-low':
        return sorted.sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));
      case 'budget':
        return sorted.sort((a, b) => (b.budgetTotal || 0) - (a.budgetTotal || 0));
      case 'applications':
        return sorted.sort((a, b) => a.applications - b.applications);
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
      acc[location] = (acc[location] || 0) + 1;
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

  const handleBookmark = useCallback((jobId: string, job: any) => {
    const isCurrentlyBookmarked = bookmarkedJobs.includes(jobId);
    const currentCount = job.bookmarks_count || 0;
    
    if (isCurrentlyBookmarked) {
      // Remove bookmark
      removeBookmark(jobId);
      setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
      // Optimistically decrement bookmark count
      setBookmarkCountUpdates(prev => ({
        ...prev,
        [jobId]: Math.max(0, currentCount - 1)
      }));
    } else {
      // Add bookmark
      const bookmarkData = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        postType: (job.postType || 'job') as 'job' | 'tender',
        budget: typeof job.budget === 'object' ? job.budget : {
          min: null,
          max: null,
          type: 'negotiable',
          currency: 'PLN',
        },
        deadline: job.deadline
      };
      addBookmark(bookmarkData);
      setBookmarkedJobs(prev => [...prev, jobId]);
      // Optimistically increment bookmark count
      setBookmarkCountUpdates(prev => ({
        ...prev,
        [jobId]: currentCount + 1
      }));
    }
  }, [bookmarkedJobs]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    if (onClearSearch) {
      onClearSearch();
    }
  }, [onClearSearch]);

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
                            Wygasłe zlecenia ({expiredJobs.length})
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