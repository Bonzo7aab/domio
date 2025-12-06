'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import type { FilterState } from '../components/JobFilters';
import { searchParamsToFilters, getFiltersUrl, hasActiveFilters } from '../utils/filterUrlSync';

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

const defaultFilters: FilterState = {
  categories: [],
  subcategories: [],
  contractTypes: [],
  locations: [],
  cities: [],
  sublocalities: [],
  provinces: [],
  budgetRanges: [],
  clientTypes: [],
  postTypes: ['job', 'tender'],
  urgency: [],
  searchQuery: '',
  dateAdded: []
};

interface FilterProviderProps {
  children: ReactNode;
  initialFilters?: FilterState;
  initialLocation?: string;
}

export function FilterProvider({ 
  children, 
  initialFilters,
  initialLocation = 'Polska'
}: FilterProviderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isInitialMount = useRef(true);
  const lastUrlUpdate = useRef<string>('');
  const hasInitializedFromUrl = useRef(false);

  // Always start with defaults or initialFilters to ensure consistent SSR/client hydration
  const [filters, setFiltersState] = useState<FilterState>(
    initialFilters || defaultFilters
  );
  const filtersRef = useRef<FilterState>(filters);
  const [primaryLocation, setPrimaryLocation] = useState<string>(initialLocation);
  const locationChangeHandlerRef = useRef<(() => void) | undefined>(undefined);

  // Keep ref in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Initialize filters from URL params on client side only (after mount)
  useEffect(() => {
    if (hasInitializedFromUrl.current || typeof window === 'undefined') {
      return;
    }

    // Read from URL params on client side
    if (searchParams && searchParams.toString()) {
      const urlFilters = searchParamsToFilters(searchParams);
      const mergedFilters: FilterState = {
        ...defaultFilters,
        ...urlFilters,
        // Ensure postTypes defaults to both if not specified
        postTypes: urlFilters.postTypes && urlFilters.postTypes.length > 0 
          ? urlFilters.postTypes 
          : ['job', 'tender']
      };
      
      setFiltersState(mergedFilters);
      lastUrlUpdate.current = searchParams.toString();
      hasInitializedFromUrl.current = true;
    } else {
      hasInitializedFromUrl.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - we intentionally don't include searchParams to avoid hydration issues

  // Update filters when URL changes (browser back/forward) - only after initial mount
  useEffect(() => {
    if (!hasInitializedFromUrl.current) {
      return;
    }

    const currentSearch = searchParams.toString();
    if (currentSearch === lastUrlUpdate.current) {
      return; // URL hasn't changed (we just set it)
    }

    const urlFilters = searchParamsToFilters(searchParams);
    const mergedFilters: FilterState = {
      ...defaultFilters,
      ...urlFilters,
      postTypes: urlFilters.postTypes && urlFilters.postTypes.length > 0 
        ? urlFilters.postTypes 
        : ['job', 'tender']
    };

    // Only update if filters actually changed (use ref to avoid dependency on filters)
    const filtersChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(mergedFilters);
    if (filtersChanged) {
      lastUrlUpdate.current = currentSearch;
      setFiltersState(mergedFilters);
    }
  }, [searchParams]); // Removed filters from dependencies to prevent infinite loop

  // Update URL when filters change (but not on initial mount)
  useEffect(() => {
    // Skip if not initialized from URL yet
    if (!hasInitializedFromUrl.current) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      // On initial mount after URL initialization, ensure URL reflects current filters
      if (hasActiveFilters(filters)) {
        const newUrl = getFiltersUrl(pathname, filters);
        const params = new URLSearchParams(newUrl.split('?')[1] || '');
        const newSearch = params.toString();
        lastUrlUpdate.current = newSearch;
        router.replace(newUrl, { scroll: false });
      } else {
        // Store current search params even if no active filters
        lastUrlUpdate.current = searchParams.toString();
      }
      return;
    }

    // Update URL with current filters
    const newUrl = getFiltersUrl(pathname, filters);
    const params = new URLSearchParams(newUrl.split('?')[1] || '');
    const newSearch = params.toString();
    
    // Only update if URL actually changed
    if (newSearch !== lastUrlUpdate.current) {
      lastUrlUpdate.current = newSearch;
      router.push(newUrl, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

  // Wrapper for setFilters that handles URL updates
  const setFilters = useCallback((newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersState(prev => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      return updated;
    });
  }, []);

  const handleLocationChangeRequest = () => {
    if (locationChangeHandlerRef.current) {
      locationChangeHandlerRef.current();
    }
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
        onLocationChangeRequest: handleLocationChangeRequest
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

