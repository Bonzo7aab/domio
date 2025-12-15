import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import JobCard from './JobCard';
import { FilterState } from './JobFilters';
import { getBookmarkedJobs, addBookmark, removeBookmark } from '../utils/bookmarkStorage';
import { extractCity, extractSublocality, getProvinceForCity } from '../utils/locationMapping';
import { isTenderEndingSoon } from '../utils/tenderHelpers';
import type { Job } from '../types/job';

interface JobListProps {
  jobs?: Job[];
  filters?: FilterState;
  // Supports both direct values and functional updates (like React's setState)
  onFilterChange?: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  onJobSelect?: (jobId: string) => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
  isLoadingJobs?: boolean;
  onApplyClick?: (jobId: string, jobData?: any) => void;
}

export default function JobList({ 
  jobs: jobsProp,
  filters,
  onFilterChange,
  onJobSelect, 
  onToggleMap, 
  isMapVisible = true,
  isLoadingJobs = false,
  onApplyClick
}: JobListProps) {
  const [sortBy, setSortBy] = useState('newest');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);

  // Load bookmarked jobs from localStorage
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

    // Reload bookmarks when window regains focus
    const handleFocus = () => {
      loadBookmarks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Use jobs from props
  const availableJobs = jobsProp || [];

  const handleBookmark = (jobId: string) => {
    const job = availableJobs.find(j => j.id === jobId);
    if (!job) return;

    const isCurrentlyBookmarked = bookmarkedJobs.includes(jobId);
    
    if (isCurrentlyBookmarked) {
      removeBookmark(jobId);
      setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
    } else {
      const jobData = job as any;
      const bookmarkData = {
        id: jobData.id,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        postType: (jobData.postType || 'job') as 'job' | 'tender',
        budget: jobData.budget || jobData.salary,
        deadline: jobData.deadline
      };
      addBookmark(bookmarkData);
      setBookmarkedJobs(prev => [...prev, jobId]);
    }
  };

  // Filter jobs based on filters
  const filteredJobs = useMemo(() => {
    if (!filters) return availableJobs;
    
    return availableJobs.filter(job => {
      // Filter by postTypes (job vs tender)
      // Defensive check: if postTypes is empty, show all jobs (shouldn't happen due to guard clauses, but handle gracefully)
      if (filters.postTypes && filters.postTypes.length > 0) {
        const jobPostType = ('postType' in job && job.postType) ? job.postType : 'job';
        if (!filters.postTypes.includes(jobPostType)) {
          return false;
        }
      } else if (filters.postTypes && filters.postTypes.length === 0) {
        // Empty array should not happen due to guard clauses, but if it does, show all jobs
        // (no return false, so job passes this filter)
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
      
      // Filter by subcategories
      if (filters.subcategories && filters.subcategories.length > 0) {
        // If job has no subcategory, skip this filter unless explicitly empty
        if (job.subcategory && !filters.subcategories.includes(job.subcategory)) {
          return false;
        }
        // If filter has subcategories but job has none, include it (don't exclude)
      }
      
      // Filter by contract types
      if (filters.contractTypes && filters.contractTypes.length > 0) {
        if (!filters.contractTypes.includes(job.type)) {
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

      // Legacy location filter support (for backward compatibility)
      if (filters.locations && filters.locations.length > 0) {
        const jobLocationString = typeof job.location === 'string' ? job.location : job.location?.city || '';
        if (!filters.locations.includes(jobLocationString)) {
          return false;
        }
      }
      
      // Filter by client types
      if (filters.clientTypes && filters.clientTypes.length > 0) {
        // If job has no clientType, include it (don't exclude)
        if (job.clientType && !filters.clientTypes.includes(job.clientType)) {
          return false;
        }
      }

      // Filter by urgency (only if job has urgency field)
      if (filters.urgency && filters.urgency.length > 0) {
        if ('urgency' in job && job.urgency && !filters.urgency.includes(job.urgency)) {
          return false;
        }
      }

      // Filter by urgent flag (high priority)
      if (filters.urgent === true) {
        if (!('urgent' in job) || !job.urgent) {
          return false;
        }
      }

      // Filter by ending soon (tenders ending in less than 7 days)
      if (filters.endingSoon && 'postType' in job && job.postType === 'tender' && 'tenderInfo' in job && job.tenderInfo?.submissionDeadline) {
        if (!isTenderEndingSoon(new Date(job.tenderInfo.submissionDeadline))) {
          return false;
        }
      }
      
      // Filter by budget ranges (checkboxes)
      if (filters.budgetRanges && filters.budgetRanges.length > 0) {
        // Get job budget values (budget_min and budget_max from job data)
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
      
      // Filter by search query (title only)
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const searchTerm = filters.searchQuery.toLowerCase().trim();
        const jobTitle = (job.title || '').toLowerCase();
        
        if (!jobTitle.includes(searchTerm)) {
          return false;
        }
      }

      // Filter by date added (created_at)
      if (filters.dateAdded && filters.dateAdded.length > 0) {
        // Get job's created_at timestamp (ISO string from database)
        const jobCreatedAt = (job as any).created_at;
        if (!jobCreatedAt) {
          // If job has no created_at, skip this filter (include the job)
        } else {
          // Parse the ISO timestamp string to Date
          const jobDate = new Date(jobCreatedAt);
          
          // Validate the date
          if (isNaN(jobDate.getTime())) {
            // Invalid date, skip filter
            return true;
          }
          
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          todayStart.setHours(0, 0, 0, 0);
          
          // Normalize jobDate to start of day for consistent comparison
          const jobDateStart = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
          jobDateStart.setHours(0, 0, 0, 0);
          
          let matchesDateFilter = false;
          for (const dateFilter of filters.dateAdded) {
            let filterStartDate: Date;
            
            switch (dateFilter) {
              case 'today':
                filterStartDate = new Date(todayStart);
                if (jobDateStart >= filterStartDate) {
                  matchesDateFilter = true;
                }
                break;
              case 'last-week':
                // Last 7 days (including today)
                filterStartDate = new Date(todayStart);
                filterStartDate.setTime(filterStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (jobDateStart >= filterStartDate) {
                  matchesDateFilter = true;
                }
                break;
              case 'last-month':
                // Last 30 days (including today)
                filterStartDate = new Date(todayStart);
                filterStartDate.setTime(filterStartDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (jobDateStart >= filterStartDate) {
                  matchesDateFilter = true;
                }
                break;
              case 'last-3-months':
                // Last 90 days (including today)
                filterStartDate = new Date(todayStart);
                filterStartDate.setTime(filterStartDate.getTime() - 90 * 24 * 60 * 60 * 1000);
                if (jobDateStart >= filterStartDate) {
                  matchesDateFilter = true;
                }
                break;
              case 'last-6-months':
                // Last 180 days (including today)
                filterStartDate = new Date(todayStart);
                filterStartDate.setTime(filterStartDate.getTime() - 180 * 24 * 60 * 60 * 1000);
                if (jobDateStart >= filterStartDate) {
                  matchesDateFilter = true;
                }
                break;
              case 'last-year':
                // Last 365 days (including today)
                filterStartDate = new Date(todayStart);
                filterStartDate.setTime(filterStartDate.getTime() - 365 * 24 * 60 * 60 * 1000);
                if (jobDateStart >= filterStartDate) {
                  matchesDateFilter = true;
                }
                break;
            }
            
            if (matchesDateFilter) break;
          }
          
          if (!matchesDateFilter) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [filters, availableJobs]);

  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(a.postedTime).getTime() - new Date(b.postedTime).getTime();
        case 'salary-high':
          return parseInt(b.salary.match(/\d+/)?.[0] || '0') - parseInt(a.salary.match(/\d+/)?.[0] || '0');
        case 'salary-low':
          return parseInt(a.salary.match(/\d+/)?.[0] || '0') - parseInt(b.salary.match(/\d+/)?.[0] || '0');
        case 'applications':
          return b.applications - a.applications;
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredJobs, sortBy]);

  // Display all sorted jobs (pagination is handled by database)
  const displayedJobs = sortedJobs;

  return (
    <div className="flex-1 p-2 sm:p-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold">Dostępne zlecenia: {sortedJobs.length}</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2 sm:gap-0">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Najnowsze</SelectItem>
              <SelectItem value="salary-high">Najwyższa stawka</SelectItem>
              <SelectItem value="salary-low">Najniższa stawka</SelectItem>
              <SelectItem value="applications">Najwięcej aplikacji</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Filters - Using functional updates to prevent stale closure issues */}
      <div className="flex flex-wrap items-center gap-2 mb-4 overflow-x-auto">
        <Badge 
          variant={filters?.urgency?.includes('high') ? "default" : "secondary"} 
          className="cursor-pointer hover:border-gray-300 text-xs whitespace-nowrap transition-colors select-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use functional update to always get latest state
            onFilterChange?.((prev) => {
              const currentUrgency = prev.urgency || [];
              if (currentUrgency.includes('high')) {
                return { ...prev, urgency: currentUrgency.filter(u => u !== 'high') };
              } else {
                return { ...prev, urgency: [...currentUrgency, 'high'] };
              }
            });
          }}
        >
          🔥 Pilne zlecenia
        </Badge>
        <Badge 
          variant={filters?.endingSoon ? "default" : "secondary"}
          className="cursor-pointer hover:border-gray-300 text-xs whitespace-nowrap transition-colors select-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use functional update to always get latest state
            onFilterChange?.((prev) => ({
              ...prev,
              endingSoon: prev.endingSoon ? false : true
            }));
          }}
        >
          ⏰ Kończące się wkrótce
        </Badge>
        <Badge 
          variant={filters?.budgetRanges?.includes('20000+') ? "default" : "secondary"}
          className="cursor-pointer hover:border-gray-300 text-xs whitespace-nowrap transition-colors select-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use functional update to always get latest state
            onFilterChange?.((prev) => {
              const currentBudgetRanges = prev.budgetRanges || [];
              if (currentBudgetRanges.includes('20000+')) {
                return { ...prev, budgetRanges: currentBudgetRanges.filter(r => r !== '20000+') };
              } else {
                return { ...prev, budgetRanges: [...currentBudgetRanges, '20000+'] };
              }
            });
          }}
        >
          💰 Wysokobudżetowe (20k+)
        </Badge>
      </div>

      {/* Loading State */}
      {isLoadingJobs && displayedJobs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">Ładowanie ogłoszeń...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingJobs && displayedJobs.length === 0 && availableJobs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">Brak ogłoszeń</div>
        </div>
      )}

      {/* Debug info - remove in production */}
      {!isLoadingJobs && displayedJobs.length === 0 && availableJobs.length > 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">
            Znaleziono {availableJobs.length} ogłoszeń, ale zostały przefiltrowane
          </div>
          <div className="text-xs text-muted-foreground">
            Dostępne: {availableJobs.length}, Filtrowane: {filteredJobs.length}, Wyświetlane: {displayedJobs.length}
          </div>
        </div>
      )}

      {/* Job Cards */}
      {!isLoadingJobs && displayedJobs.length > 0 && (
        <div className="space-y-2 max-w-full overflow-x-hidden">
          {displayedJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onClick={() => onJobSelect?.(job.id)}
              onBookmark={handleBookmark}
              isBookmarked={bookmarkedJobs.includes(job.id)}
              onApplyClick={onApplyClick}
            />
          ))}
        </div>
      )}

    </div>
  );
}