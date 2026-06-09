'use client';

import React, { useCallback, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFilterContext } from '../contexts/FilterContext';
import { WARSAW_CITY, type FilterState } from '../lib/filters/filter-state';
import { getFiltersUrl } from '../utils/filterUrlSync';
import { Input } from './ui/input';

export function HeaderJobSearch({ className }: { className?: string }) {
  const { filters, setFilters } = useFilterContext();
  const pathname = usePathname();
  const router = useRouter();
  const [searchDraft, setSearchDraft] = useState(filters.searchQuery ?? '');
  const [syncedSearchQuery, setSyncedSearchQuery] = useState(filters.searchQuery ?? '');

  if ((filters.searchQuery ?? '') !== syncedSearchQuery) {
    const next = filters.searchQuery ?? '';
    setSyncedSearchQuery(next);
    setSearchDraft(next);
  }

  const applySearch = useCallback(
    (nextSearch: string) => {
      const next: FilterState = {
        ...filters,
        searchQuery: nextSearch,
        cities: [WARSAW_CITY],
        sublocalities: [],
      };
      setFilters(next);
      if (pathname !== '/') {
        router.push(getFiltersUrl('/', next));
      }
    },
    [filters, pathname, router, setFilters]
  );

  const commitSearch = () => {
    applySearch(searchDraft.trim());
  };

  return (
    <div className={`flex items-center gap-2 flex-1 max-w-xl ${className ?? ''}`}>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitSearch();
          }}
          onBlur={commitSearch}
          placeholder="Szukaj po tytule, kategorii…"
          className="pl-9 h-10 w-full"
          aria-label="Szukaj konkursów"
        />
      </div>
      <div
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
        aria-label="Lokalizacja"
      >
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{WARSAW_CITY}</span>
      </div>
    </div>
  );
}
