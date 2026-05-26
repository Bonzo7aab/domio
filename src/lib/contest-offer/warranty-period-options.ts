import type { WarrantyGuaranteePeriod } from '../../types/tender-contest';

const ALL_MONTH_OPTIONS = [12, 24, 36, 48, 60] as const;

function minimumMonthsFromPeriod(period: string | null | undefined): number {
  switch (period as WarrantyGuaranteePeriod | undefined) {
    case 'min_12':
      return 12;
    case 'min_24':
      return 24;
    case 'min_36':
      return 36;
    case 'none':
      return 0;
    case 'other':
      return 12;
    default:
      return 0;
  }
}

export function warrantyMonthsOptions(minPeriod: string | null | undefined): number[] {
  const min = minimumMonthsFromPeriod(minPeriod);
  if (min <= 0) {
    return [...ALL_MONTH_OPTIONS];
  }
  const options = ALL_MONTH_OPTIONS.filter((m) => m >= min);
  if (options.length === 0) {
    return [min, min + 12, min + 24].filter((v, i, arr) => arr.indexOf(v) === i);
  }
  return options;
}

export function formatMonthsLabel(months: number): string {
  if (months === 1) return '1 miesiąc';
  const last = months % 10;
  const lastTwo = months % 100;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return `${months} miesiące`;
  }
  return `${months} miesięcy`;
}
