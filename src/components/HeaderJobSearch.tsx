'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFilterContext } from '../contexts/FilterContext';
import { getWarsawDistrictsForFilters } from '../lib/filters/filter-logic';
import { WARSAW_CITY, type FilterState } from '../lib/filters/filter-state';
import { getFiltersUrl } from '../utils/filterUrlSync';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';

const ALL_DISTRICTS = '__all__';

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

  const districts = useMemo(() => getWarsawDistrictsForFilters(), []);

  const selectedDistrict = useMemo(() => {
    const warsaw = filters.sublocalities.find((s) => s.startsWith(`${WARSAW_CITY}:`));
    if (!warsaw) return ALL_DISTRICTS;
    return warsaw.split(':')[1] ?? ALL_DISTRICTS;
  }, [filters.sublocalities]);

  const buildNextFilters = useCallback(
    (nextSearch: string, district: string): FilterState => ({
      ...filters,
      searchQuery: nextSearch,
      sublocalities:
        district === ALL_DISTRICTS ? [] : [`${WARSAW_CITY}:${district}`],
    }),
    [filters]
  );

  const applyFilters = useCallback(
    (nextSearch: string, district: string) => {
      const next = buildNextFilters(nextSearch, district);
      setFilters(next);
      if (pathname !== '/') {
        router.push(getFiltersUrl('/', next));
      }
    },
    [buildNextFilters, pathname, router, setFilters]
  );

  const commitSearch = () => {
    applyFilters(searchDraft.trim(), selectedDistrict);
  };

  const handleDistrictChange = (value: string) => {
    applyFilters(searchDraft.trim(), value);
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
          placeholder="Czego szukasz?"
          className="pl-9 h-10 w-full"
          aria-label="Czego szukasz?"
        />
      </div>
      <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
        <SelectTrigger className="w-[140px] sm:w-[160px] h-10 shrink-0">
          <MapPin className="h-4 w-4 mr-1 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Lokalizacja" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_DISTRICTS}>Wszystkie dzielnice</SelectItem>
          {districts.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
