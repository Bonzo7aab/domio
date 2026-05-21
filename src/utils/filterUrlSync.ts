import type { FilterState, DeadlineFilterKey } from '../lib/filters/filter-state';
import { defaultFilters, isDefaultPostTypes } from '../lib/filters/filter-state';
import { migrateDateAddedToDeadline } from '../lib/filters/filter-logic';

export type { FilterState } from '../lib/filters/filter-state';
export { defaultFilters } from '../lib/filters/filter-state';

/**
 * Serializes filter state to URL search parameters
 */
export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.subcategories.length > 0) {
    params.set('subcategories', filters.subcategories.join(','));
  }
  if (filters.sublocalities.length > 0) {
    params.set('sublocalities', filters.sublocalities.join(','));
  }
  if (filters.budgetMin !== undefined && filters.budgetMin !== null) {
    params.set('budgetMin', filters.budgetMin.toString());
  }
  if (filters.budgetMax !== undefined && filters.budgetMax !== null) {
    params.set('budgetMax', filters.budgetMax.toString());
  }
  if (filters.searchQuery?.trim()) {
    params.set('search', filters.searchQuery.trim());
  }
  if (filters.deadline.length > 0) {
    params.set('deadline', filters.deadline.join(','));
  }
  if (filters.postTypes.length > 0 && !isDefaultPostTypes(filters.postTypes)) {
    params.set('postTypes', filters.postTypes.join(','));
  }

  return params;
}

/**
 * Deserializes URL search parameters to filter state
 */
export function searchParamsToFilters(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  const categories = searchParams.get('categories');
  if (categories) {
    filters.categories = categories.split(',').filter(Boolean);
  }

  const subcategories = searchParams.get('subcategories');
  if (subcategories) {
    filters.subcategories = subcategories.split(',').filter(Boolean);
  }

  const sublocalities = searchParams.get('sublocalities');
  if (sublocalities) {
    filters.sublocalities = sublocalities.split(',').filter(Boolean);
  }

  const budgetMin = searchParams.get('budgetMin');
  if (budgetMin) {
    const parsed = parseFloat(budgetMin);
    if (!isNaN(parsed)) filters.budgetMin = parsed;
  }

  const budgetMax = searchParams.get('budgetMax');
  if (budgetMax) {
    const parsed = parseFloat(budgetMax);
    if (!isNaN(parsed)) filters.budgetMax = parsed;
  }

  const search = searchParams.get('search');
  if (search) {
    filters.searchQuery = search.trim();
  }

  const deadline = searchParams.get('deadline');
  if (deadline) {
    filters.deadline = deadline.split(',').filter(Boolean) as DeadlineFilterKey[];
  } else {
    const dateAdded = searchParams.get('dateAdded');
    if (dateAdded) {
      filters.deadline = migrateDateAddedToDeadline(
        dateAdded.split(',').filter(Boolean)
      );
    }
  }

  const postTypes = searchParams.get('postTypes');
  if (postTypes) {
    filters.postTypes = postTypes.split(',').filter(Boolean);
  }

  return filters;
}

export function getFiltersUrl(pathname: string, filters: FilterState): string {
  const params = filtersToSearchParams(filters);
  return params.toString() ? `${pathname}?${params.toString()}` : pathname;
}

export function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.categories.length > 0 ||
    filters.subcategories.length > 0 ||
    filters.sublocalities.length > 0 ||
    filters.budgetMin != null ||
    filters.budgetMax != null ||
    (filters.searchQuery && filters.searchQuery.trim()) ||
    filters.deadline.length > 0 ||
    !isDefaultPostTypes(filters.postTypes)
  );
}
