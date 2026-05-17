/**
 * Manager zgłoszenie workflow (KAN-9).
 * DB values are snake_case; labels match Jira spec.
 */

export const JOB_WORKFLOW_STATUSES = [
  'collecting_offers',
  'selecting_offer',
  'in_progress',
  'ready_for_acceptance',
  'completed',
] as const;

export type JobWorkflowStatus = (typeof JOB_WORKFLOW_STATUSES)[number];

export const JOB_LEGACY_STATUSES = [
  'draft',
  'active',
  'paused',
  'cancelled',
  'inactive',
] as const;

export type JobStatus =
  | JobWorkflowStatus
  | (typeof JOB_LEGACY_STATUSES)[number];

const WORKFLOW_LABELS: Record<JobWorkflowStatus, string> = {
  collecting_offers: 'Zbieranie ofert',
  selecting_offer: 'Wybór ofert',
  in_progress: 'W realizacji',
  ready_for_acceptance: 'Do odbioru',
  completed: 'Zakończone',
};

const LEGACY_LABELS: Record<string, string> = {
  draft: 'Szkic',
  active: 'Zbieranie ofert',
  paused: 'Wstrzymane',
  cancelled: 'Anulowane',
  inactive: 'Nieaktywne',
};

const WORKFLOW_ORDER: Record<string, number> = {
  draft: 0,
  collecting_offers: 1,
  active: 1,
  selecting_offer: 2,
  in_progress: 3,
  ready_for_acceptance: 4,
  completed: 5,
  paused: 6,
  cancelled: 7,
  inactive: 8,
};

export function normalizeJobStatus(status: string): JobStatus {
  if (status === 'active') return 'collecting_offers';
  return status as JobStatus;
}

export function getJobWorkflowStatusLabel(status: string): string {
  const normalized = normalizeJobStatus(status);
  if (normalized in WORKFLOW_LABELS) {
    return WORKFLOW_LABELS[normalized as JobWorkflowStatus];
  }
  return LEGACY_LABELS[status] || status;
}

export function getJobWorkflowStatusSortIndex(status: string): number {
  const normalized = normalizeJobStatus(status);
  return WORKFLOW_ORDER[normalized] ?? WORKFLOW_ORDER[status] ?? 99;
}

export function isManagerWorkflowStatus(status: string): boolean {
  const n = normalizeJobStatus(status);
  return (JOB_WORKFLOW_STATUSES as readonly string[]).includes(n);
}

/** Statuses managers can pick in the Zgłoszenia table / detail. */
export function getManagerSelectableWorkflowStatuses(): JobWorkflowStatus[] {
  return [...JOB_WORKFLOW_STATUSES];
}

export function canManagerEditJobFields(status: string): boolean {
  const n = status === 'active' ? 'collecting_offers' : status;
  return n === 'draft' || n === 'collecting_offers';
}

export function isJobPublishedStatus(status: string): boolean {
  const n = normalizeJobStatus(status);
  return n !== 'draft' && n !== 'cancelled';
}
