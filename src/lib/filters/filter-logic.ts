import type { Job } from '../../types/job';
import { WARSAW_DISTRICTS } from '../config/warsawDistricts';
import { extractCity, extractSublocality } from '../../utils/locationMapping';
import type { DeadlineFilterKey, FilterState } from './filter-state';
import { WARSAW_CITY } from './filter-state';

export function getJobDeadline(job: Job): Date | null {
  if (job.deadline) {
    const d = new Date(job.deadline);
    if (!isNaN(d.getTime())) return d;
  }
  if (
    'postType' in job &&
    job.postType === 'tender' &&
    'tenderInfo' in job &&
    job.tenderInfo?.submissionDeadline
  ) {
    const d = new Date(job.tenderInfo.submissionDeadline);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function parseJobBudgetAmount(job: Job): number {
  const budgetMin = job.budget?.min ?? null;
  const budgetMax = job.budget?.max ?? null;
  if (budgetMax != null) return Number(budgetMax);
  if (budgetMin != null) return Number(budgetMin);
  const raw = ('budget_max' in job ? job.budget_max : undefined) as number | undefined;
  if (raw != null) return Number(raw);
  const minRaw = ('budget_min' in job ? job.budget_min : undefined) as number | undefined;
  if (minRaw != null) return Number(minRaw);
  const match = (job.salary || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function startOfDay(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(0, 0, 0, 0);
  return x;
}

export function matchesDeadlineFilter(deadline: Date, filter: DeadlineFilterKey): boolean {
  const now = new Date();
  const today = startOfDay(now);
  const deadlineDay = startOfDay(deadline);

  switch (filter) {
    case 'today':
      return deadlineDay.getTime() === today.getTime();
    case 'within-week': {
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      return deadline >= today && deadline <= end;
    }
    case 'within-month': {
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      return deadline >= today && deadline <= end;
    }
    case 'within-3-months': {
      const end = new Date(today);
      end.setDate(end.getDate() + 90);
      return deadline >= today && deadline <= end;
    }
    case 'within-6-months': {
      const end = new Date(today);
      end.setDate(end.getDate() + 180);
      return deadline >= today && deadline <= end;
    }
    case 'within-year': {
      const end = new Date(today);
      end.setDate(end.getDate() + 365);
      return deadline >= today && deadline <= end;
    }
    default:
      return false;
  }
}

/** Map legacy URL dateAdded keys to deadline keys */
export function migrateDateAddedToDeadline(values: string[]): DeadlineFilterKey[] {
  const map: Record<string, DeadlineFilterKey> = {
    today: 'today',
    'last-week': 'within-week',
    'last-month': 'within-month',
    'last-3-months': 'within-3-months',
    'last-6-months': 'within-6-months',
    'last-year': 'within-year',
    'within-week': 'within-week',
    'within-month': 'within-month',
    'within-3-months': 'within-3-months',
    'within-6-months': 'within-6-months',
    'within-year': 'within-year',
  };
  return values
    .map((v) => map[v])
    .filter((v): v is DeadlineFilterKey => Boolean(v));
}

export function jobMatchesFilters(job: Job, filters: FilterState): boolean {
  if (filters.postTypes?.length > 0) {
    const jobPostType = ('postType' in job && job.postType) ? job.postType : 'job';
    if (!filters.postTypes.includes(jobPostType)) return false;
  }

  if (filters.categories.length > 0) {
    const jobCategory =
      typeof job.category === 'string'
        ? job.category
        : job.category?.name || 'Inne';
    if (!filters.categories.includes(jobCategory)) return false;
  }

  if (filters.subcategories.length > 0) {
    if (job.subcategory && !filters.subcategories.includes(job.subcategory)) {
      return false;
    }
  }

  if (filters.sublocalities.length > 0) {
    const jobCity = extractCity(job.location);
    const jobSublocality = extractSublocality(job.location);
    const matches = filters.sublocalities.some((key) => {
      const [filterCity, filterSublocality] = key.split(':');
      return jobCity === filterCity && jobSublocality === filterSublocality;
    });
    if (!matches) return false;
  }

  if (filters.budgetMin != null) {
    const amount = parseJobBudgetAmount(job);
    if (amount > 0 && amount < filters.budgetMin) return false;
  }

  if (filters.budgetMax != null) {
    const amount = parseJobBudgetAmount(job);
    if (amount > 0 && amount > filters.budgetMax) return false;
  }

  if (filters.searchQuery?.trim()) {
    const term = filters.searchQuery.toLowerCase().trim();
    if (!(job.title || '').toLowerCase().includes(term)) return false;
  }

  if (filters.deadline.length > 0) {
    const jobDeadline = getJobDeadline(job);
    if (!jobDeadline) return false;
    const matchesAny = filters.deadline.some((f) =>
      matchesDeadlineFilter(jobDeadline, f)
    );
    if (!matchesAny) return false;
  }

  return true;
}

/** All official Warsaw districts for filter UI (including those with zero listings). */
export function getWarsawDistrictsForFilters(): string[] {
  return [...WARSAW_DISTRICTS];
}

export function getDeadlineFilterCounts(jobs: Job[]): Record<DeadlineFilterKey, number> {
  const counts = {} as Record<DeadlineFilterKey, number>;
  const keys: DeadlineFilterKey[] = [
    'today',
    'within-week',
    'within-month',
    'within-3-months',
    'within-6-months',
    'within-year',
  ];
  for (const key of keys) {
    counts[key] = 0;
  }
  for (const job of jobs) {
    const deadline = getJobDeadline(job);
    if (!deadline) continue;
    for (const key of keys) {
      if (matchesDeadlineFilter(deadline, key)) {
        counts[key] += 1;
      }
    }
  }
  return counts;
}

/** @deprecated Prefer getWarsawDistrictsForFilters — kept for job-derived district sets. */
export function getWarsawDistrictsFromJobs(jobs: Job[]): string[] {
  const districts = new Set<string>();
  jobs.forEach((job) => {
    const city = extractCity(job.location);
    if (city !== WARSAW_CITY) return;
    const sub = extractSublocality(job.location);
    if (sub) districts.add(sub);
  });
  return Array.from(districts).sort();
}
