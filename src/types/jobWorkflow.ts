export const JOB_WORKFLOW_STATUSES = [
  'collecting_offers',
  'choosing_offer',
  'in_progress',
  'ready_for_acceptance',
  'completed',
] as const;

export type JobWorkflowStatus = typeof JOB_WORKFLOW_STATUSES[number];

export const JOB_STATUS_LABELS: Record<string, string> = {
  collecting_offers: 'Zbieranie ofert',
  choosing_offer: 'Wybór ofert',
  in_progress: 'W realizacji',
  ready_for_acceptance: 'Do odbioru',
  completed: 'Zakończone',
  draft: 'Szkic',
  active: 'Zbieranie ofert',
  paused: 'Wstrzymane',
  cancelled: 'Anulowane',
  inactive: 'Nieaktywne',
};

export const JOB_STATUS_DESCRIPTIONS: Record<JobWorkflowStatus, string> = {
  collecting_offers: 'Zarządca czeka na wyceny.',
  choosing_offer: 'Wpłynęły oferty, zarządca musi zdecydować.',
  in_progress: 'Wykonawca wybrany, pracuje na obiekcie.',
  ready_for_acceptance: 'Wykonawca zakończył prace i dodał zdjęcia po naprawie.',
  completed: 'Zarządca odebrał prace, raport jest gotowy do pobrania.',
};

export function getJobStatusLabel(status?: string | null): string {
  if (!status) return JOB_STATUS_LABELS.collecting_offers;
  return JOB_STATUS_LABELS[status] || status;
}

export function isCompletedWorkflowStatus(status?: string | null): boolean {
  return status === 'completed';
}

export function getJobStatusMeta(status?: string | null): { label: string; description: string } {
  const normalizedStatus = status === 'active' || !status ? 'collecting_offers' : status;
  const isWorkflowStatus = JOB_WORKFLOW_STATUSES.includes(normalizedStatus as JobWorkflowStatus);

  return {
    label: getJobStatusLabel(status),
    description: isWorkflowStatus
      ? JOB_STATUS_DESCRIPTIONS[normalizedStatus as JobWorkflowStatus]
      : 'Status zgłoszenia.',
  };
}

export function getJobStatusConfig(status?: string | null) {
  const colorMap: Record<string, string> = {
    collecting_offers: 'bg-blue-100 text-blue-800',
    active: 'bg-blue-100 text-blue-800',
    choosing_offer: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-orange-100 text-orange-800',
    ready_for_acceptance: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return {
    label: getJobStatusLabel(status),
    color: colorMap[status || 'collecting_offers'] || 'bg-yellow-100 text-yellow-800',
  };
}
