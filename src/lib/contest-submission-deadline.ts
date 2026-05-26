export interface SubmissionDeadlineDisplay {
  formatted: string;
  hint: string | null;
  isPast: boolean;
}

function formatDeadlineDateTime(deadline: Date): string {
  return deadline.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pluralDays(n: number): string {
  if (n === 1) return 'dzień';
  if (n >= 2 && n <= 4) return 'dni';
  return 'dni';
}

/**
 * Formats contest submission deadline for list cells and compare tooltips.
 */
export function formatSubmissionDeadlineDisplay(
  deadlineIso: string | null | undefined,
  now: Date = new Date(),
): SubmissionDeadlineDisplay | null {
  if (!deadlineIso) return null;

  const deadline = new Date(deadlineIso);
  if (Number.isNaN(deadline.getTime())) return null;

  const formatted = formatDeadlineDateTime(deadline);
  const diffMs = deadline.getTime() - now.getTime();
  const isPast = diffMs < 0;

  if (isPast) {
    return { formatted, hint: 'Zakończone', isPast: true };
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 14) {
    return {
      formatted,
      hint: `Za ${days} ${pluralDays(days)}`,
      isPast: false,
    };
  }

  return { formatted, hint: null, isPast: false };
}

export function formatCompareLockedTooltip(deadlineIso: string | null | undefined): string {
  const display = formatSubmissionDeadlineDisplay(deadlineIso);
  if (!display) {
    return 'Porównanie będzie dostępne po zakończeniu zbierania ofert.';
  }
  return `Porównanie będzie dostępne po zakończeniu zbierania ofert (${display.formatted})`;
}
