/**
 * Calculate days remaining until a deadline
 * @param deadline - Date string or Date object
 * @returns Number of days remaining (0 if past deadline)
 */
export function getDaysRemaining(deadline: string | Date): number {
  const now = new Date();
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Check if a tender is ending soon (less than 7 days remaining)
 * @param deadline - Date string or Date object
 * @returns True if less than 7 days remaining
 */
export function isTenderEndingSoon(deadline: string | Date): boolean {
  const daysRemaining = getDaysRemaining(deadline);
  return daysRemaining > 0 && daysRemaining < 7;
}

/**
 * Format days remaining text in Polish
 * @param days - Number of days
 * @returns Formatted string (e.g., "1 dzień", "5 dni")
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return '0 dni';
  if (days === 1) return '1 dzień';
  if (days < 5) return `${days} dni`;
  return `${days} dni`;
}

