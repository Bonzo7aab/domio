import type { FilterState } from '../components/JobFilters';

/**
 * Serializes filter state to URL search parameters
 */
export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Arrays are encoded as comma-separated values
  if (filters.categories && filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.subcategories && filters.subcategories.length > 0) {
    params.set('subcategories', filters.subcategories.join(','));
  }
  if (filters.contractTypes && filters.contractTypes.length > 0) {
    params.set('contractTypes', filters.contractTypes.join(','));
  }
  if (filters.cities && filters.cities.length > 0) {
    params.set('cities', filters.cities.join(','));
  }
  if (filters.sublocalities && filters.sublocalities.length > 0) {
    params.set('sublocalities', filters.sublocalities.join(','));
  }
  if (filters.provinces && filters.provinces.length > 0) {
    params.set('provinces', filters.provinces.join(','));
  }
  if (filters.budgetRanges && filters.budgetRanges.length > 0) {
    params.set('budgetRanges', filters.budgetRanges.join(','));
  }
  if (filters.clientTypes && filters.clientTypes.length > 0) {
    params.set('clientTypes', filters.clientTypes.join(','));
  }
  if (filters.postTypes && filters.postTypes.length > 0) {
    // Only include if not default (both job and tender)
    if (filters.postTypes.length !== 2 || 
        !filters.postTypes.includes('job') || 
        !filters.postTypes.includes('tender')) {
      params.set('postTypes', filters.postTypes.join(','));
    }
  }

  if (filters.urgency && filters.urgency.length > 0) {
    params.set('urgency', filters.urgency.join(','));
  }
  
  // Numbers
  if (filters.budgetMin !== undefined && filters.budgetMin !== null) {
    params.set('budgetMin', filters.budgetMin.toString());
  }
  if (filters.budgetMax !== undefined && filters.budgetMax !== null) {
    params.set('budgetMax', filters.budgetMax.toString());
  }
  
  // String
  if (filters.searchQuery && filters.searchQuery.trim()) {
    params.set('search', filters.searchQuery.trim());
  }

  // Boolean
  if (filters.endingSoon) {
    params.set('endingSoon', 'true');
  }

  // Legacy locations support (for backward compatibility)
  if (filters.locations && filters.locations.length > 0) {
    params.set('locations', filters.locations.join(','));
  }

  return params;
}

/**
 * Deserializes URL search parameters to filter state
 */
export function searchParamsToFilters(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  // Arrays are decoded from comma-separated values
  const categories = searchParams.get('categories');
  if (categories) {
    filters.categories = categories.split(',').filter(Boolean);
  }

  const subcategories = searchParams.get('subcategories');
  if (subcategories) {
    filters.subcategories = subcategories.split(',').filter(Boolean);
  }

  const contractTypes = searchParams.get('contractTypes');
  if (contractTypes) {
    filters.contractTypes = contractTypes.split(',').filter(Boolean);
  }

  const cities = searchParams.get('cities');
  if (cities) {
    filters.cities = cities.split(',').filter(Boolean);
  }

  const sublocalities = searchParams.get('sublocalities');
  if (sublocalities) {
    filters.sublocalities = sublocalities.split(',').filter(Boolean);
  }

  const provinces = searchParams.get('provinces');
  if (provinces) {
    filters.provinces = provinces.split(',').filter(Boolean);
  }

  const budgetRanges = searchParams.get('budgetRanges');
  if (budgetRanges) {
    filters.budgetRanges = budgetRanges.split(',').filter(Boolean);
  }

  const clientTypes = searchParams.get('clientTypes');
  if (clientTypes) {
    filters.clientTypes = clientTypes.split(',').filter(Boolean);
  }

  const postTypes = searchParams.get('postTypes');
  if (postTypes) {
    filters.postTypes = postTypes.split(',').filter(Boolean);
  }

  const urgency = searchParams.get('urgency');
  if (urgency) {
    filters.urgency = urgency.split(',').filter(Boolean);
  }

  // Numbers
  const budgetMin = searchParams.get('budgetMin');
  if (budgetMin) {
    const parsed = parseFloat(budgetMin);
    if (!isNaN(parsed)) {
      filters.budgetMin = parsed;
    }
  }

  const budgetMax = searchParams.get('budgetMax');
  if (budgetMax) {
    const parsed = parseFloat(budgetMax);
    if (!isNaN(parsed)) {
      filters.budgetMax = parsed;
    }
  }

  // String
  const search = searchParams.get('search');
  if (search) {
    filters.searchQuery = search.trim();
  }

  // Boolean
  const endingSoon = searchParams.get('endingSoon');
  if (endingSoon === 'true') {
    filters.endingSoon = true;
  }

  // Legacy locations support
  const locations = searchParams.get('locations');
  if (locations) {
    filters.locations = locations.split(',').filter(Boolean);
  }

  return filters;
}

/**
 * Updates the browser URL with filter parameters without causing a page reload
 * Returns the new URL string for use with Next.js router
 */
export function getFiltersUrl(pathname: string, filters: FilterState): string {
  const params = filtersToSearchParams(filters);
  return params.toString() 
    ? `${pathname}?${params.toString()}`
    : pathname;
}

/**
 * Checks if filters have any active values (non-default state)
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    (filters.categories && filters.categories.length > 0) ||
    (filters.subcategories && filters.subcategories.length > 0) ||
    (filters.contractTypes && filters.contractTypes.length > 0) ||
    (filters.cities && filters.cities.length > 0) ||
    (filters.sublocalities && filters.sublocalities.length > 0) ||
    (filters.provinces && filters.provinces.length > 0) ||
    (filters.budgetRanges && filters.budgetRanges.length > 0) ||
    (filters.clientTypes && filters.clientTypes.length > 0) ||
    (filters.budgetMin !== undefined && filters.budgetMin !== null) ||
    (filters.budgetMax !== undefined && filters.budgetMax !== null) ||
    (filters.searchQuery && filters.searchQuery.trim()) ||
    (filters.postTypes && filters.postTypes.length !== 2) ||
    (filters.urgency && filters.urgency.length > 0) ||
    (filters.locations && filters.locations.length > 0) ||
    filters.endingSoon
  );
}

