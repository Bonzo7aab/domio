import type { DeadlineFilterKey } from './filter-state';

export const DEADLINE_FILTER_OPTIONS: { value: DeadlineFilterKey; label: string }[] = [
  { value: 'within-48h', label: 'W ciągu 48h' },
  { value: 'within-7-days', label: '7 dni' },
  { value: 'within-14-days', label: '14 dni' },
  { value: 'over-14-days', label: 'Ponad 14 dni' },
];

export function getDeadlineFilterLabel(key: DeadlineFilterKey): string {
  return DEADLINE_FILTER_OPTIONS.find((o) => o.value === key)?.label ?? key;
}
