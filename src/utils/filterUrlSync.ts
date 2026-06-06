import type { FilterState } from '../lib/filters/filter-state';
import { defaultFilters, isDefaultPostTypes } from '../lib/filters/filter-state';
import { migrateLegacyDeadlineKeys } from '../lib/filters/filter-logic';

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
  if (filters.searchQuery?.trim()) {
    params.set('search', filters.searchQuery.trim());
  }
  if (filters.deadline.length > 0) {
    params.set('deadline', filters.deadline.join(','));
  }
  if (filters.postTypes.length > 0 && !isDefaultPostTypes(filters.postTypes)) {
    params.set('postTypes', filters.postTypes.join(','));
  }
  if (filters.favoritesOnly) {
    params.set('favorites', '1');
  }
  if (filters.noDeposit) {
    params.set('noDeposit', '1');
  }
  if (filters.noReferencesRequired) {
    params.set('noReferences', '1');
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

  const search = searchParams.get('search');
  if (search) {
    filters.searchQuery = search.trim();
  }

  const deadline = searchParams.get('deadline');
  if (deadline) {
    filters.deadline = migrateLegacyDeadlineKeys(
      deadline.split(',').filter(Boolean),
    );
  } else {
    const dateAdded = searchParams.get('dateAdded');
    if (dateAdded) {
      filters.deadline = migrateLegacyDeadlineKeys(
        dateAdded.split(',').filter(Boolean),
      );
    }
  }

  const postTypes = searchParams.get('postTypes');
  if (postTypes) {
    filters.postTypes = postTypes.split(',').filter(Boolean);
  }

  const favorites = searchParams.get('favorites');
  if (favorites === '1' || favorites === 'true') {
    filters.favoritesOnly = true;
  }

  const noDeposit = searchParams.get('noDeposit');
  if (noDeposit === '1' || noDeposit === 'true') {
    filters.noDeposit = true;
  }

  const noReferences = searchParams.get('noReferences');
  if (noReferences === '1' || noReferences === 'true') {
    filters.noReferencesRequired = true;
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
    (filters.searchQuery && filters.searchQuery.trim()) ||
    filters.deadline.length > 0 ||
    !isDefaultPostTypes(filters.postTypes) ||
    filters.favoritesOnly ||
    filters.noDeposit ||
    filters.noReferencesRequired
  );
}
