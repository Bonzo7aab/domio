/** Shared filter state for homepage job listings (KAN-6). */

export const DEFAULT_POST_TYPES = ['contest'] as const;

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
  /** Selected cities — homepage defaults to Warszawa only (OPD-90). */
  cities: string[];
  /** @deprecated District filters removed (OPD-90); kept for URL backward compatibility. */
  sublocalities: string[];
  searchQuery?: string;
  /** Zakończenie przyjmowania ofert — deadline window filters */
  deadline: DeadlineFilterKey[];
  /** Public browse shows contests only. Kept for URL backward compatibility. */
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
  cities: [WARSAW_CITY],
  sublocalities: [],
  searchQuery: '',
  deadline: [],
  postTypes: [...DEFAULT_POST_TYPES],
  favoritesOnly: false,
  noDeposit: false,
  noReferencesRequired: false,
};

export function isDefaultPostTypes(postTypes: string[]): boolean {
  return postTypes.length === 1 && postTypes.includes('contest');
}

export function isDefaultCities(cities: string[]): boolean {
  return cities.length === 1 && cities[0] === WARSAW_CITY;
}
