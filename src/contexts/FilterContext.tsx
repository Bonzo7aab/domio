'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import type { FilterState } from '../lib/filters/filter-state';
import { defaultFilters } from '../lib/filters/filter-state';
import {
  searchParamsToFilters,
  getFiltersUrl,
  hasActiveFilters,
} from '../utils/filterUrlSync';

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  primaryLocation: string;
  setPrimaryLocation: (location: string) => void;
  setLocationChangeHandler: (handler: () => void) => void;
  onLocationChangeRequest: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}

interface FilterProviderProps {
  children: ReactNode;
  initialFilters?: FilterState;
  initialLocation?: string;
}

export function FilterProvider({
  children,
  initialFilters,
  initialLocation = 'Polska',
}: FilterProviderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isInitialMount = useRef(true);
  const lastUrlUpdate = useRef<string>('');
  const hasInitializedFromUrl = useRef(false);

  const [filters, setFiltersState] = useState<FilterState>(
    initialFilters || defaultFilters
  );
  const filtersRef = useRef<FilterState>(filters);
  const [primaryLocation, setPrimaryLocation] = useState<string>(initialLocation);
  const locationChangeHandlerRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (hasInitializedFromUrl.current || typeof window === 'undefined') {
      return;
    }

    if (searchParams && searchParams.toString()) {
      const urlFilters = searchParamsToFilters(searchParams);
      const mergedFilters: FilterState = {
        ...defaultFilters,
        ...urlFilters,
        postTypes:
          urlFilters.postTypes && urlFilters.postTypes.length > 0
            ? urlFilters.postTypes
            : defaultFilters.postTypes,
        deadline: urlFilters.deadline ?? defaultFilters.deadline,
      };

      setFiltersState(mergedFilters);
      lastUrlUpdate.current = searchParams.toString();
      hasInitializedFromUrl.current = true;
    } else {
      hasInitializedFromUrl.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasInitializedFromUrl.current) return;

    const currentSearch = searchParams.toString();
    if (currentSearch === lastUrlUpdate.current) return;

    const urlFilters = searchParamsToFilters(searchParams);
    const mergedFilters: FilterState = {
      ...defaultFilters,
      ...urlFilters,
      postTypes:
        urlFilters.postTypes && urlFilters.postTypes.length > 0
          ? urlFilters.postTypes
          : defaultFilters.postTypes,
      deadline: urlFilters.deadline ?? defaultFilters.deadline,
    };

    const filtersChanged =
      JSON.stringify(filtersRef.current) !== JSON.stringify(mergedFilters);
    if (filtersChanged) {
      lastUrlUpdate.current = currentSearch;
      setFiltersState(mergedFilters);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!hasInitializedFromUrl.current) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (hasActiveFilters(filters)) {
        const newUrl = getFiltersUrl(pathname, filters);
        const params = new URLSearchParams(newUrl.split('?')[1] || '');
        const newSearch = params.toString();
        lastUrlUpdate.current = newSearch;
        router.replace(newUrl, { scroll: false });
      } else {
        lastUrlUpdate.current = searchParams.toString();
      }
      return;
    }

    const newUrl = getFiltersUrl(pathname, filters);
    const params = new URLSearchParams(newUrl.split('?')[1] || '');
    const newSearch = params.toString();

    if (newSearch !== lastUrlUpdate.current) {
      lastUrlUpdate.current = newSearch;
      router.push(newUrl, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

  const setFilters = useCallback(
    (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
      setFiltersState((prev) =>
        typeof newFilters === 'function' ? newFilters(prev) : newFilters
      );
    },
    []
  );

  const handleLocationChangeRequest = () => {
    locationChangeHandlerRef.current?.();
  };

  const setLocationChangeHandler = (handler: () => void) => {
    locationChangeHandlerRef.current = handler;
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        primaryLocation,
        setPrimaryLocation,
        setLocationChangeHandler,
        onLocationChangeRequest: handleLocationChangeRequest,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}
