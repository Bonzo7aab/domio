import React, { useEffect, useMemo, useState } from 'react';
import { addBookmark, getBookmarkedJobs, removeBookmark } from '../utils/bookmarkStorage';
import { getStoredJobs, Job } from '../utils/jobStorage';
import JobCard from './JobCard';
import { FilterState } from './JobFilters';
import { JobListHeader } from './JobListHeader';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface EnhancedJobListProps {
  jobs?: any[]; // Jobs data from parent
  isLoadingJobs?: boolean; // Loading state from parent
  filters?: FilterState;
  onJobSelect?: (jobId: string) => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
  hoveredJobId?: string | null;
  onJobHover?: (jobId: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  searchRadius?: number;
  onApplyClick?: (jobId: string, jobData?: any) => void;
  onClearSearch?: () => void; // Dodane do czyszczenia wyszukiwania
  onPrimaryLocationChange?: (location: string) => void; // Dodane do przekazywania primaryLocation
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
  const [storedJobs, setStoredJobs] = useState<Job[]>([]);
  
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
  
  // Use jobs from props, fallback to stored jobs if needed
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
    
    return uniqueJobs;
  }, [jobs, storedJobs, isLoadingJobs]);

  // Simple search functionality
  const searchFilteredJobs = useMemo(() => {
    // Use search query from filters if available, otherwise fall back to local state
    const activeSearchQuery = filters?.searchQuery || searchQuery;
    
    if (!activeSearchQuery.trim()) return allJobs;

    const query = activeSearchQuery.toLowerCase();
    return allJobs.filter(job => {
      const searchText = [
        job.title,
        job.description,
        job.company,
        job.location,
        job.category,
        job.subcategory,
        ...(job.searchKeywords || [])
      ].join(' ').toLowerCase();

      return searchText.includes(query);
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
      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(job.category)) {
        return false;
      }
      
      // Filter by locations
      if (filters.locations && filters.locations.length > 0 && !filters.locations.includes(job.location)) {
        return false;
      }
      
      // Filter by client types
      if (filters.clientTypes && filters.clientTypes.length > 0 && !filters.clientTypes.includes(job.clientType)) {
        return false;
      }
      
      // Filter by salary range
      const jobSalary = (job as any).salaryMin || 0;
      if (jobSalary < filters.salaryRange[0] || jobSalary > filters.salaryRange[1]) {
        return false;
      }
      
      // Filter by rating
      if (filters.rating > 0 && (job.rating || 0) < filters.rating) {
        return false;
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
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted;
    }
  }, [filteredJobs, sortBy]);

  // Get displayed jobs with simple pagination
  const displayedJobs = sortedJobs.slice(0, loadedCount);

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

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Job List Header */}
          <div className="p-4 pb-0">
            <JobListHeader 
              totalResults={allJobs.length}
              filteredResults={sortedJobs.length}
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
            ) : displayedJobs.length === 0 ? (
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
              displayedJobs.map((job, index) => (
                <JobCard
                  key={job.id || `fallback-${index}`}
                  job={job}
                  onClick={() => onJobSelect?.(job.id)}
                  onMouseEnter={() => onJobHover?.(job.id)}
                  onMouseLeave={() => onJobHover?.(null)}
                  isHighlighted={hoveredJobId === job.id}
                  isBookmarked={bookmarkedJobs.includes(job.id)}
                  onBookmark={(jobId) => {
                    const isCurrentlyBookmarked = bookmarkedJobs.includes(jobId);
                    
                    if (isCurrentlyBookmarked) {
                      // Remove bookmark
                      removeBookmark(jobId);
                      setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
                    } else {
                      // Add bookmark
                      const bookmarkData = {
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        postType: (job.postType || 'job') as 'job' | 'tender',
                        budget: job.budget || job.salary,
                        deadline: job.deadline
                      };
                      addBookmark(bookmarkData);
                      setBookmarkedJobs(prev => [...prev, jobId]);
                    }
                  }}
                  onApplyClick={onApplyClick}
                />
              ))
            )}

            {/* Load More Button */}
            {sortedJobs.length > loadedCount && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setLoadedCount(prev => prev + 10)}
                >
                  Załaduj więcej ogłoszeń
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};