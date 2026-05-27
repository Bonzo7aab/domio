/** Shared filter state for homepage job listings (KAN-6). */

export const DEFAULT_POST_TYPES = ['tender'] as const;

export const WARSAW_CITY = 'Warszawa';

export type DeadlineFilterKey =
  | 'today'
  | 'within-week'
  | 'within-month'
  | 'within-3-months'
  | 'within-6-months'
  | 'within-year';

export interface FilterState {
  categories: string[];
  subcategories: string[];
  sublocalities: string[];
  budgetMin?: number;
  budgetMax?: number;
  searchQuery?: string;
  /** Termin realizacji — deadline window filters */
  deadline: DeadlineFilterKey[];
  /** Public browse shows contests only (`tender` rows). Kept for URL backward compatibility. */
  postTypes: string[];
  /** Show only locally bookmarked listings. */
  favoritesOnly: boolean;
}

export const defaultFilters: FilterState = {
  categories: [],
  subcategories: [],
  sublocalities: [],
  searchQuery: '',
  deadline: [],
  postTypes: [...DEFAULT_POST_TYPES],
  favoritesOnly: false,
};

export function isDefaultPostTypes(postTypes: string[]): boolean {
  return postTypes.length === 1 && postTypes.includes('tender');
}
