/** Shared filter state for homepage job listings (KAN-6). */

export const DEFAULT_POST_TYPES = ['job', 'tender'] as const;

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
  /** Always both types on homepage; kept for URL backward compatibility */
  postTypes: string[];
  /** Show only jobs/tenders saved to favorites (local bookmarks). */
  favoritesOnly?: boolean;
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
  return (
    postTypes.length === 2 &&
    postTypes.includes('job') &&
    postTypes.includes('tender')
  );
}
