/** Shared filter state for homepage job listings (KAN-6). */

export const DEFAULT_POST_TYPES = ['tender'] as const;

export const WARSAW_CITY = 'Warszawa';

/** Submission deadline windows — time remaining until offer deadline. */
export type DeadlineFilterKey =
  | 'within-48h'
  | 'within-7-days'
  | 'within-14-days'
  | 'over-14-days';

export interface FilterState {
  categories: string[];
  subcategories: string[];
  sublocalities: string[];
  searchQuery?: string;
  /** Zakończenie przyjmowania ofert — deadline window filters */
  deadline: DeadlineFilterKey[];
  /** Public browse shows contests only (`tender` rows). Kept for URL backward compatibility. */
  postTypes: string[];
  /** Show only locally bookmarked listings. */
  favoritesOnly: boolean;
  /** Kryteria formalne — show contests without deposit (wadium). */
  noDeposit: boolean;
  /** Kryteria formalne — show contests without required references. */
  noReferencesRequired: boolean;
}

export const defaultFilters: FilterState = {
  categories: [],
  subcategories: [],
  sublocalities: [],
  searchQuery: '',
  deadline: [],
  postTypes: [...DEFAULT_POST_TYPES],
  favoritesOnly: false,
  noDeposit: false,
  noReferencesRequired: false,
};

export function isDefaultPostTypes(postTypes: string[]): boolean {
  return postTypes.length === 1 && postTypes.includes('tender');
}
