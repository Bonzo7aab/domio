'use client';

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import type { FilterState } from '../components/JobFilters';

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
  initialLocation = 'Polska'
}: FilterProviderProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      categories: [],
      subcategories: [],
      contractTypes: [],
      locations: [],
      salaryRange: [0, 1000],
      rating: 0,
      clientTypes: [],
      postTypes: ['job', 'tender'],
      tenderTypes: [],
      searchRadius: 25,
      useGeolocation: false,
      searchQuery: ''
    }
  );
  
  const [primaryLocation, setPrimaryLocation] = useState<string>(initialLocation);
  const locationChangeHandlerRef = useRef<(() => void) | undefined>(undefined);

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

