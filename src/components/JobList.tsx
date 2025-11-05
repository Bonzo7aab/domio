import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import JobCard from './JobCard';
import { FilterState } from './JobFilters';
import { getBookmarkedJobs, addBookmark, removeBookmark } from '../utils/bookmarkStorage';
import { jobListMockData } from '../mocks';

interface JobListProps {
  jobs?: any[];
  filters?: FilterState;
  onJobSelect?: (jobId: string) => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
  isLoadingJobs?: boolean;
}

const mockJobs = jobListMockData;

export default function JobList({ 
  jobs: jobsProp,
  filters, 
  onJobSelect, 
  onToggleMap, 
  isMapVisible = true,
  isLoadingJobs = false
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

  // Use jobs from props if provided, otherwise fallback to mock data
  const availableJobs = (jobsProp && jobsProp.length > 0) ? jobsProp : mockJobs;

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
      if (filters.postTypes && filters.postTypes.length > 0) {
        const jobPostType = job.postType || 'job';
        if (!filters.postTypes.includes(jobPostType)) {
          return false;
        }
      }
      
      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        const jobCategory = job.category || 'Inne';
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
      
      // Filter by tenderTypes (only for tenders)
      if (filters.tenderTypes && filters.tenderTypes.length > 0) {
        const jobPostType = job.postType || 'job';
        if (jobPostType === 'tender') {
          const tenderType = job.tenderInfo?.tenderType || job.tenderType;
          if (tenderType && !filters.tenderTypes.includes(tenderType)) {
            return false;
          }
          // If tender has no tenderType specified, exclude it when tenderTypes filter is active
          if (!tenderType) {
            return false;
          }
        }
      }
      
      // Filter by contract types
      if (filters.contractTypes && filters.contractTypes.length > 0) {
        if (!filters.contractTypes.includes(job.type)) {
          return false;
        }
      }
      
      // Filter by locations
      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.includes(job.location)) {
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
      
      // Filter by salary range (extract minimum salary for comparison)
      if (filters.salaryRange && Array.isArray(filters.salaryRange) && filters.salaryRange.length === 2) {
        const [minRange, maxRange] = filters.salaryRange;
        // Skip salary filtering if it's the default range [0, 1000] - too restrictive
        // Only apply salary filter if user explicitly set a meaningful range
        if (maxRange > 1000 || minRange > 0) {
          try {
            // Handle different salary formats: "100 PLN", "0 - 100 PLN", "100-200 PLN"
            const salaryStr = job.salary || job.budget || '';
            if (salaryStr) {
              const numbers = salaryStr.match(/\d+/g);
              if (numbers && numbers.length > 0) {
                const jobMinSalary = parseInt(numbers[0]) || 0;
                if (jobMinSalary < minRange || jobMinSalary > maxRange) {
                  return false;
                }
              }
            }
            // If no salary info, include the job (don't exclude)
          } catch (e) {
            // If salary parsing fails, include the job (don't exclude)
            console.warn('Failed to parse salary for job:', job.id, e);
          }
        }
      }
      
      // Filter by search query
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const searchTerm = filters.searchQuery.toLowerCase().trim();
        const searchableFields = [
          job.title,
          job.description,
          job.location,
          job.company,
          job.category,
          job.subcategory
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchTerm)) {
          return false;
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
          <h2 className="text-lg sm:text-xl font-bold">Dostępne Zlecenia</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Znaleziono {sortedJobs.length} zleceń</p>
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

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 overflow-x-auto">
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs whitespace-nowrap">
          Pilne zlecenia
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs whitespace-nowrap">
          Zweryfikowani klienci
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs whitespace-nowrap">
          Wysoko płatne (100+ zł/h)
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs whitespace-nowrap">
          Premium wykonawcy
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs whitespace-nowrap">
          Z ubezpieczeniem OC
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
            />
          ))}
        </div>
      )}

    </div>
  );
}