/** Flag keys in Cloudflare Flagship (kebab-case). */
export const FLAGSHIP_FLAG_KEYS = {
  NEW_TENDER_SYSTEM: 'new-tender-system',
  ENHANCED_MAP: 'enhanced-map',
  ADVANCED_FILTERS: 'advanced-filters',
  MOBILE_OPTIMIZATIONS: 'mobile-optimizations',
  ORDERS: 'orders',
  CONTRACTOR_SERVICES: 'contractor-services',
} as const;

export type FlagshipFlagKey = (typeof FLAGSHIP_FLAG_KEYS)[keyof typeof FLAGSHIP_FLAG_KEYS];

/** Human-readable labels for the testing UI. */
export const FLAGSHIP_FLAG_LABELS: Record<FlagshipFlagKey, string> = {
  [FLAGSHIP_FLAG_KEYS.NEW_TENDER_SYSTEM]: 'Nowy system przetargów',
  [FLAGSHIP_FLAG_KEYS.ENHANCED_MAP]: 'Ulepszona mapa',
  [FLAGSHIP_FLAG_KEYS.ADVANCED_FILTERS]: 'Zaawansowane filtry',
  [FLAGSHIP_FLAG_KEYS.MOBILE_OPTIMIZATIONS]: 'Optymalizacje mobile',
  [FLAGSHIP_FLAG_KEYS.ORDERS]: 'Zamówienia',
  [FLAGSHIP_FLAG_KEYS.CONTRACTOR_SERVICES]: 'Usługi wykonawcy',
};

export const TESTING_FEATURE_FLAG_KEYS: readonly FlagshipFlagKey[] = [
  FLAGSHIP_FLAG_KEYS.NEW_TENDER_SYSTEM,
  FLAGSHIP_FLAG_KEYS.ENHANCED_MAP,
  FLAGSHIP_FLAG_KEYS.ADVANCED_FILTERS,
  FLAGSHIP_FLAG_KEYS.MOBILE_OPTIMIZATIONS,
  FLAGSHIP_FLAG_KEYS.ORDERS,
  FLAGSHIP_FLAG_KEYS.CONTRACTOR_SERVICES,
];

export type TestingFeatureFlags = Record<FlagshipFlagKey, boolean>;
