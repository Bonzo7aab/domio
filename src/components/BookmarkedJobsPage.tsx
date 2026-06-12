'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Star, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  getBookmarkedJobs,
  removeBookmark,
  type BookmarkedJob,
} from '../utils/bookmarkStorage';
import { toast } from 'sonner';
import JobCard from './JobCard';
import {
  bookmarkToListingJob,
  formatKonkursCountLabel,
  isContestBookmark,
} from '../lib/listing/bookmark-to-listing-job';
import { BOOKMARK_COUNT_CHANGED_EVENT } from '../utils/bookmarkCountOverrides';
import { useContractorContestBidStatus } from '../hooks/useContractorContestBidStatus';

interface BookmarkedJobsPageProps {
  onBack: () => void;
  onJobSelect: (jobId: string) => void;
  /** When true, omits page title (contractor dashboard nav provides it). */
  embedded?: boolean;
}

export const BookmarkedJobsPage: React.FC<BookmarkedJobsPageProps> = ({
  onBack,
  onJobSelect,
  embedded = false,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { submittedIds, draftIds, isLoading: isLoadingBidStatus } =
    useContractorContestBidStatus();

  const loadBookmarks = useCallback(() => {
    const saved = getBookmarkedJobs().filter(isContestBookmark);
    setBookmarks(saved);
  }, []);

  useEffect(() => {
    queueMicrotask(() => loadBookmarks());
    const sync = () => loadBookmarks();
    window.addEventListener('focus', sync);
    window.addEventListener(BOOKMARK_COUNT_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener(BOOKMARK_COUNT_CHANGED_EVENT, sync);
    };
  }, [loadBookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const query = searchQuery.toLowerCase();
    return bookmarks.filter((bookmark) => {
      const locationStr =
        typeof bookmark.location === 'string'
          ? bookmark.location
          : [bookmark.location?.city, bookmark.location?.sublocality_level_1]
              .filter(Boolean)
              .join(', ');
      return (
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.company.toLowerCase().includes(query) ||
        locationStr.toLowerCase().includes(query)
      );
    });
  }, [bookmarks, searchQuery]);

  const listingJobs = useMemo(
    () => filteredBookmarks.map(bookmarkToListingJob),
    [filteredBookmarks],
  );

  const handleRemoveBookmark = useCallback(
    (jobId: string, jobTitle: string, entityType: BookmarkedJob['entityType']) => {
      void removeBookmark(jobId, entityType);
      loadBookmarks();
      toast.success(`Usunięto z zapisanych: ${jobTitle}`);
    },
    [loadBookmarks],
  );

  const handleBookmarkToggle = useCallback(
    (jobId: string) => {
      const bookmark = bookmarks.find((b) => b.id === jobId);
      if (bookmark) {
        handleRemoveBookmark(jobId, bookmark.title, bookmark.entityType);
      }
    },
    [bookmarks, handleRemoveBookmark],
  );

  const countLabel = formatKonkursCountLabel(bookmarks.length);

  return (
    <div className={embedded ? 'space-y-4' : 'min-h-screen bg-background'}>
      {!embedded && (
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="hidden md:flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Powrót
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Zapisane konkursy</h1>
                  <p className="text-sm text-muted-foreground">{countLabel}</p>
                </div>
              </div>
              <Star className="w-6 h-6 text-primary fill-primary" aria-hidden />
            </div>
          </div>
        </div>
      )}

      <div className={embedded ? 'space-y-4' : 'container mx-auto px-4 py-6 space-y-4'}>
        {embedded && bookmarks.length > 0 && (
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        )}

        {bookmarks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Szukaj w zapisanych konkursach…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {filteredBookmarks.length === 0 && bookmarks.length > 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Brak wyników</h3>
            <p className="text-muted-foreground">
              Nie znaleziono konkursów pasujących do wyszukiwania &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Brak zapisanych konkursów</h3>
            <p className="text-muted-foreground mb-6">
              Nie masz jeszcze żadnych zapisanych konkursów.
              <br />
              Kliknij gwiazdkę przy konkursie na liście, aby zapisać go tutaj.
            </p>
            <Button onClick={onBack}>Przeglądaj konkursy</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {listingJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isBookmarked
                onClick={() => onJobSelect(job.id)}
                onBookmark={handleBookmarkToggle}
                onApplyClick={(jobId) => onJobSelect(jobId)}
                hasSubmittedOffer={submittedIds.has(job.id)}
                hasDraftOffer={draftIds.has(job.id)}
                isCheckingOffer={isLoadingBidStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
