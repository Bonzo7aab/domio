import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Heart, Map } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Toggle } from './ui/toggle';
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
  matchesFavoritesFilter,
  parseJobBudgetAmount,
  getJobDeadline,
} from '../lib/filters/filter-logic';
import { useFilterContext } from '../contexts/FilterContext';
import { useContractorContestBidStatus } from '../hooks/useContractorContestBidStatus';
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
  const { submittedIds, draftIds, isLoading: isLoadingBidStatus } =
    useContractorContestBidStatus();
  const [sortBy, setSortBy] = useState('newest');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [bookmarkCountUpdates, setBookmarkCountUpdates] = useState<Record<string, number>>({});
  const [viewCountUpdates, setViewCountUpdates] = useState<Record<string, number>>({});

  useEffect(() => {
    queueMicrotask(() => {
      setBookmarkedJobs(getBookmarkedJobs().map((b) => b.id));
      setBookmarkCountUpdates(readBookmarkCountOverrides());
      try {
        const stored = sessionStorage.getItem('view-count-updates');
        setViewCountUpdates(stored ? JSON.parse(stored) : {});
      } catch {
        setViewCountUpdates({});
      }
    });
  }, []);

  useEffect(() => {
    const syncBookmarkCounts = () => {
      setBookmarkCountUpdates(readBookmarkCountOverrides());
    };
    const syncBookmarks = () => {
      syncBookmarkCounts();
      try {
        const bookmarks = getBookmarkedJobs();
        setBookmarkedJobs(bookmarks.map((b) => b.id));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(BOOKMARK_COUNT_CHANGED_EVENT, syncBookmarks);
    window.addEventListener('focus', syncBookmarks);
    return () => {
      window.removeEventListener(BOOKMARK_COUNT_CHANGED_EVENT, syncBookmarks);
      window.removeEventListener('focus', syncBookmarks);
    };
  }, []);

  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const bookmarks = getBookmarkedJobs();
        setBookmarkedJobs(bookmarks.map((b) => b.id));
        setBookmarkCountUpdates(readBookmarkCountOverrides());
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    };
    loadBookmarks();
    window.addEventListener('focus', loadBookmarks);
    return () => window.removeEventListener('focus', loadBookmarks);
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

  const bookmarkedIdSet = useMemo(() => new Set(bookmarkedJobs), [bookmarkedJobs]);

  const filteredJobs = useMemo(() => {
    return availableJobs.filter((job) => {
      if (isJobExpired(job)) return false;
      if (filters?.favoritesOnly && !matchesFavoritesFilter(job.id, true, bookmarkedIdSet)) {
        return false;
      }
      if (!filters) return true;
      return jobMatchesFilters(job, filters);
    });
  }, [filters, availableJobs, bookmarkedIdSet]);

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


  return (
    <div className="flex-1 p-2 sm:p-4 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold">
            Dostępne konkursy: {sortedJobs.length}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {filters && onFilterChange && (
            <Toggle
              variant="outline"
              size="sm"
              pressed={filters.favoritesOnly}
              onPressedChange={(pressed) =>
                onFilterChange((prev) => ({ ...prev, favoritesOnly: pressed }))
              }
              aria-label="Pokaż tylko ulubione"
              className="gap-1.5 px-3 h-9"
            >
              <Heart
                className={cn(
                  'h-4 w-4 shrink-0',
                  filters.favoritesOnly && 'fill-red-500 text-red-500',
                )}
              />
              <span className="text-sm">Ulubione</span>
            </Toggle>
          )}

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
                {isMapVisible ? 'Wróć do listy' : 'Zobacz mapę'}
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
            <div className="text-muted-foreground mb-2">Ładowanie konkursów...</div>
          </div>
        </div>
      )}

      {!isLoadingJobs && sortedJobs.length === 0 && availableJobs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">Brak konkursów</div>
        </div>
      )}

      {!isLoadingJobs && sortedJobs.length === 0 && availableJobs.length > 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">
            {filters?.favoritesOnly
              ? 'Brak ulubionych konkursów pasujących do filtrów'
              : 'Brak konkursów pasujących do filtrów'}
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
              hasSubmittedOffer={submittedIds.has(job.id)}
              hasDraftOffer={draftIds.has(job.id)}
              isCheckingOffer={isLoadingBidStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
