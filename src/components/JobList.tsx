import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Map } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import JobCard from './JobCard';
import { FilterState } from './JobFilters';
import { getBookmarkedJobs, addBookmark, removeBookmark } from '../utils/bookmarkStorage';
import { jobListMockData } from '../mocks';

interface JobListProps {
  filters?: FilterState;
  onJobSelect?: (jobId: string) => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
}

const mockJobs = jobListMockData;

export default function JobList({ filters, onJobSelect, onToggleMap, isMapVisible = true }: JobListProps) {
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

  const handleBookmark = (jobId: string) => {
    const job = mockJobs.find(j => j.id === jobId);
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
    if (!filters) return mockJobs;
    
    return mockJobs.filter(job => {
      // Filter by subcategories
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(job.subcategory)) {
        return false;
      }
      
      // Filter by contract types
      if (filters.contractTypes.length > 0 && !filters.contractTypes.includes(job.type)) {
        return false;
      }
      
      // Filter by locations
      if (filters.locations.length > 0 && !filters.locations.includes(job.location)) {
        return false;
      }
      
      // Filter by client types
      if (filters.clientTypes.length > 0 && !filters.clientTypes.includes(job.clientType)) {
        return false;
      }
      
      // Filter by rating
      if (filters.rating > 0 && job.rating < filters.rating) {
        return false;
      }
      
      // Filter by salary range (extract minimum salary for comparison)
      const jobMinSalary = parseInt(job.salary.match(/\d+/)?.[0] || '0');
      if (jobMinSalary < filters.salaryRange[0] || jobMinSalary > filters.salaryRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [filters]);

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(a.postedTime).getTime() - new Date(b.postedTime).getTime();
      case 'salary-high':
        return parseInt(b.salary.match(/\d+/)?.[0] || '0') - parseInt(a.salary.match(/\d+/)?.[0] || '0');
      case 'salary-low':
        return parseInt(a.salary.match(/\d+/)?.[0] || '0') - parseInt(b.salary.match(/\d+/)?.[0] || '0');
      case 'applications':
        return b.applications - a.applications;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="flex-1 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Dostępne Zlecenia</h2>
          <p className="text-muted-foreground">Znaleziono {sortedJobs.length} zleceń</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Najnowsze</SelectItem>
              <SelectItem value="salary-high">Najwyższa stawka</SelectItem>
              <SelectItem value="salary-low">Najniższa stawka</SelectItem>
              <SelectItem value="applications">Najwięcej aplikacji</SelectItem>
              <SelectItem value="rating">Najwyżej oceniane</SelectItem>
            </SelectContent>
          </Select>

          {/* Map Toggle Button */}
          <Button
            variant={isMapVisible ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleMap}
            className="px-3"
          >
            <Map className="w-4 h-4 mr-2" />
            {isMapVisible ? 'Ukryj mapę' : 'Pokaż mapę'}
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center space-x-2 mb-4">
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs">
          Pilne zlecenia
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs">
          Zweryfikowani klienci
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs">
          Wysoko płatne (100+ zł/h)
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs">
          Premium wykonawcy
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/10 text-xs">
          Z ubezpieczeniem OC
        </Badge>
      </div>

      {/* Job Cards */}
      <div className="space-y-2">
        {sortedJobs.map(job => (
          <JobCard 
            key={job.id} 
            job={job} 
            onClick={() => onJobSelect?.(job.id)}
            onBookmark={handleBookmark}
            isBookmarked={bookmarkedJobs.includes(job.id)}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-8">
        <Button variant="outline" size="lg">
          Load More Jobs
        </Button>
      </div>
    </div>
  );
}