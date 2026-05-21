import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Map, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import JobCard from './JobCard';
import { ActiveFilterChips } from './ActiveFilterChips';
import type { FilterState } from '../lib/filters/filter-state';
import { getBookmarkedJobs, addBookmark, removeBookmark } from '../utils/bookmarkStorage';
import {
  BOOKMARK_COUNT_CHANGED_EVENT,
  readBookmarkCountOverrides,
} from '../utils/bookmarkCountOverrides';
import { isJobExpired } from '../utils/jobHelpers';
import {
  jobMatchesFilters,
  parseJobBudgetAmount,
  getJobDeadline,
} from '../lib/filters/filter-logic';
import { useFilterContext } from '../contexts/FilterContext';
import type { Job } from '../types/job';
import { cn } from './ui/utils';

interface JobListProps {
  jobs?: Job[];
  filters?: FilterState;
  onFilterChange?: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  onJobSelect?: (jobId: string) => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
  isLoadingJobs?: boolean;
  onApplyClick?: (jobId: string, jobData?: Job) => void;
}

export default function JobList({
  jobs: jobsProp,
  filters,
  onFilterChange,
  onJobSelect,
  onToggleMap,
  isMapVisible = false,
  isLoadingJobs = false,
  onApplyClick,
}: JobListProps) {
  const { primaryLocation } = useFilterContext();
  const [sortBy, setSortBy] = useState('newest');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>(() => {
    try {
      return getBookmarkedJobs().map((b) => b.id);
    } catch {
      return [];
    }
  });
  const [bookmarkCountUpdates, setBookmarkCountUpdates] = useState<Record<string, number>>(
    () => readBookmarkCountOverrides(),
  );
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

  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const bookmarks = getBookmarkedJobs();
        setBookmarkedJobs(bookmarks.map((b) => b.id));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    };
    const handleFocus = () => loadBookmarks();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const effectiveBookmarkCounts = useMemo(() => {
    const merged = { ...bookmarkCountUpdates };
    if (!jobsProp?.length) return merged;
    for (const job of jobsProp) {
      const serverCount = ('bookmarks_count' in job ? job.bookmarks_count : 0) as number;
      const optimisticCount = bookmarkCountUpdates[job.id];
      if (optimisticCount !== undefined) {
        merged[job.id] = optimisticCount;
      }
    }
    return merged;
  }, [jobsProp, bookmarkCountUpdates]);

  const availableJobs = useMemo(() => {
    const jobs = jobsProp || [];
    return jobs.map((job) => {
      let updatedJob = { ...job };
      const bookmarkCountUpdate = effectiveBookmarkCounts[job.id];
      if (bookmarkCountUpdate !== undefined) {
        updatedJob = { ...updatedJob, bookmarks_count: bookmarkCountUpdate };
      }
      const viewCountUpdate = viewCountUpdates[job.id];
      if (viewCountUpdate !== undefined) {
        updatedJob = {
          ...updatedJob,
          visits_count: viewCountUpdate,
          metrics: { ...updatedJob.metrics, visits: viewCountUpdate },
        };
      }
      return updatedJob;
    });
  }, [jobsProp, effectiveBookmarkCounts, viewCountUpdates]);

  const handleBookmark = (jobId: string) => {
    const job = availableJobs.find((j) => j.id === jobId);
    if (!job) return;

    const isCurrentlyBookmarked = bookmarkedJobs.includes(jobId);
    const currentCount = ('bookmarks_count' in job ? job.bookmarks_count : 0) as number;

    if (isCurrentlyBookmarked) {
      void removeBookmark(jobId, undefined, undefined, currentCount);
      setBookmarkedJobs((prev) => prev.filter((id) => id !== jobId));
    } else {
      void addBookmark(
        {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          postType: (job.postType || 'job') as 'job' | 'tender',
          budget: job.budget || job.salary,
          deadline: job.deadline,
        },
        undefined,
        undefined,
        currentCount,
      );
      setBookmarkedJobs((prev) => [...prev, jobId]);
    }
  };

  const filteredJobs = useMemo(() => {
    return availableJobs.filter((job) => {
      if (isJobExpired(job)) return false;
      if (filters?.favoritesOnly && !bookmarkedJobs.includes(job.id)) {
        return false;
      }
      if (!filters) return true;
      return jobMatchesFilters(job, filters);
    });
  }, [filters, availableJobs, bookmarkedJobs]);

  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs];
    const noDeadline = (j: Job) => Number.MAX_SAFE_INTEGER;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.postedTime).getTime() - new Date(a.postedTime).getTime()
          );
        case 'budget-high':
          return parseJobBudgetAmount(b) - parseJobBudgetAmount(a);
        case 'budget-low':
          return parseJobBudgetAmount(a) - parseJobBudgetAmount(b);
        case 'deadline-soon': {
          const da = getJobDeadline(a)?.getTime() ?? noDeadline(a);
          const db = getJobDeadline(b)?.getTime() ?? noDeadline(b);
          return da - db;
        }
        case 'deadline-far': {
          const da = getJobDeadline(a)?.getTime() ?? 0;
          const db = getJobDeadline(b)?.getTime() ?? 0;
          if (da === 0 && db === 0) return 0;
          if (da === 0) return 1;
          if (db === 0) return -1;
          return db - da;
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredJobs, sortBy]);


  const setListingTab = (favoritesOnly: boolean) => {
    if (!onFilterChange) return;
    onFilterChange((prev) => ({
      ...(prev ?? filters ?? { categories: [], subcategories: [], sublocalities: [], deadline: [], postTypes: ['job', 'tender'], favoritesOnly: false }),
      favoritesOnly,
    }));
  };

  const showFavoritesTab = filters?.favoritesOnly === true;

  return (
    <div className="flex-1 p-2 sm:p-4 max-w-full overflow-x-hidden">
      {onFilterChange && (
        <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg w-fit max-w-full">
          <button
            type="button"
            onClick={() => setListingTab(false)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              !showFavoritesTab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Wszystkie
          </button>
          <button
            type="button"
            onClick={() => setListingTab(true)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5',
              showFavoritesTab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', showFavoritesTab && 'fill-current text-primary')} />
            Ulubione
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold">
            {showFavoritesTab ? 'Ulubione zgłoszenia' : 'Dostępne zgłoszenia'}: {sortedJobs.length}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Sortuj:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-52">
                <ArrowUpDown className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Od najnowszych</SelectItem>
                <SelectItem value="budget-high">Budżet malejąco</SelectItem>
                <SelectItem value="budget-low">Budżet rosnąco</SelectItem>
                <SelectItem value="deadline-soon">Bliski termin</SelectItem>
                <SelectItem value="deadline-far">Daleki termin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {onToggleMap && (
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5">
              <Map className="w-4 h-4 text-muted-foreground shrink-0" />
              <Label htmlFor="map-toggle" className="text-sm cursor-pointer whitespace-nowrap">
                Zobacz mapę
              </Label>
              <Switch
                id="map-toggle"
                checked={isMapVisible}
                onCheckedChange={() => onToggleMap()}
              />
            </div>
          )}
        </div>
      </div>

      {filters && onFilterChange && (
        <ActiveFilterChips
          filters={filters}
          onFilterChange={onFilterChange}
          primaryLocation={primaryLocation}
        />
      )}

      {isLoadingJobs && sortedJobs.length === 0 && (
        <div className="text-center py-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <div className="text-muted-foreground mb-2">Ładowanie ogłoszeń...</div>
          </div>
        </div>
      )}

      {!isLoadingJobs && sortedJobs.length === 0 && availableJobs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">Brak ogłoszeń</div>
        </div>
      )}

      {!isLoadingJobs && sortedJobs.length === 0 && availableJobs.length > 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">
            {showFavoritesTab
              ? 'Brak ulubionych zgłoszeń. Dodaj serce przy ogłoszeniu, aby je tu zobaczyć.'
              : 'Brak ogłoszeń pasujących do filtrów'}
          </div>
        </div>
      )}

      {sortedJobs.length > 0 && (
        <div className="space-y-2 max-w-full overflow-x-hidden">
          {sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => onJobSelect?.(job.id)}
              onBookmark={handleBookmark}
              isBookmarked={bookmarkedJobs.includes(job.id)}
              onApplyClick={onApplyClick}
              isExpired={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
