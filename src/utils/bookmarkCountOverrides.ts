const BOOKMARK_COUNT_UPDATES_KEY = 'bookmark-count-updates';

export const BOOKMARK_COUNT_CHANGED_EVENT = 'domio:bookmark-count-changed';

export function readBookmarkCountOverrides(): Record<string, number> {
  try {
    const stored = sessionStorage.getItem(BOOKMARK_COUNT_UPDATES_KEY);
    return stored ? (JSON.parse(stored) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function writeBookmarkCountOverrides(overrides: Record<string, number>): void {
  try {
    sessionStorage.setItem(BOOKMARK_COUNT_UPDATES_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent(BOOKMARK_COUNT_CHANGED_EVENT));
  } catch {
    // Ignore quota / private mode errors
  }
}

/** Apply optimistic bookmark count after user adds a favorite. */
export function incrementBookmarkCountOverride(
  jobId: string,
  baselineCount: number,
): void {
  const overrides = readBookmarkCountOverrides();
  const base = overrides[jobId] ?? baselineCount;
  overrides[jobId] = base + 1;
  writeBookmarkCountOverrides(overrides);
}

/** Apply optimistic bookmark count after user removes a favorite. */
export function decrementBookmarkCountOverride(
  jobId: string,
  baselineCount?: number,
): void {
  const overrides = readBookmarkCountOverrides();
  const base =
    overrides[jobId] ??
    (baselineCount !== undefined ? baselineCount : 0);
  overrides[jobId] = Math.max(0, base - 1);
  writeBookmarkCountOverrides(overrides);
}

export function clearBookmarkCountOverride(jobId: string): void {
  const overrides = readBookmarkCountOverrides();
  if (!(jobId in overrides)) return;
  delete overrides[jobId];
  writeBookmarkCountOverrides(overrides);
}
