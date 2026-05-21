import type { DeadlineFilterKey } from './filter-state';

export const DEADLINE_FILTER_OPTIONS: { value: DeadlineFilterKey; label: string }[] = [
  { value: 'today', label: 'Dzisiaj' },
  { value: 'within-week', label: 'W tym tygodniu' },
  { value: 'within-month', label: 'W tym miesiącu' },
  { value: 'within-3-months', label: 'W ciągu 3 miesięcy' },
  { value: 'within-6-months', label: 'W ciągu 6 miesięcy' },
  { value: 'within-year', label: 'W ciągu roku' },
];

export function getDeadlineFilterLabel(key: DeadlineFilterKey): string {
  return DEADLINE_FILTER_OPTIONS.find((o) => o.value === key)?.label ?? key;
}
