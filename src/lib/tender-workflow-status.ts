/**
 * Manager przetarg workflow (aligned with job labels where applicable).
 */

export const TENDER_WORKFLOW_STATUSES = ['active', 'evaluation', 'awarded'] as const;

export type TenderWorkflowStatus = (typeof TENDER_WORKFLOW_STATUSES)[number];

const WORKFLOW_LABELS: Record<TenderWorkflowStatus, string> = {
  active: 'Zbieranie ofert',
  evaluation: 'Wybór ofert',
  awarded: 'W realizacji',
};

const EXTRA_LABELS: Record<string, string> = {
  draft: 'Szkic',
  paused: 'Wstrzymane',
  cancelled: 'Anulowane',
};

export function getTenderWorkflowStatusLabel(status: string): string {
  if (status in WORKFLOW_LABELS) {
    return WORKFLOW_LABELS[status as TenderWorkflowStatus];
  }
  return EXTRA_LABELS[status] || status;
}

export function getTenderWorkflowStatusIndex(status: string): number {
  const idx = TENDER_WORKFLOW_STATUSES.indexOf(status as TenderWorkflowStatus);
  return idx >= 0 ? idx : -1;
}

export function getNextTenderWorkflowStatus(status: string): TenderWorkflowStatus | null {
  const idx = getTenderWorkflowStatusIndex(status);
  if (idx < 0 || idx >= TENDER_WORKFLOW_STATUSES.length - 1) {
    return null;
  }
  return TENDER_WORKFLOW_STATUSES[idx + 1];
}

export function getManagerAllowedTenderStatuses(
  status: string,
  hasSelectedOffer: boolean,
): string[] {
  if (status === 'draft') {
    return ['draft', ...TENDER_WORKFLOW_STATUSES];
  }
  if (!(TENDER_WORKFLOW_STATUSES as readonly string[]).includes(status)) {
    return [...TENDER_WORKFLOW_STATUSES];
  }

  const currentIdx = TENDER_WORKFLOW_STATUSES.indexOf(status as TenderWorkflowStatus);
  const minIdx = hasSelectedOffer
    ? TENDER_WORKFLOW_STATUSES.indexOf('awarded')
    : 0;

  return TENDER_WORKFLOW_STATUSES.filter((_, i) => i >= currentIdx && i >= minIdx);
}

export interface TenderWorkflowAdvanceAction {
  currentLabel: string;
  nextLabel: string;
  nextStatus: TenderWorkflowStatus;
}

export function getTenderWorkflowAdvanceAction(
  status: string,
  hasSelectedOffer: boolean,
): TenderWorkflowAdvanceAction | null {
  if (hasSelectedOffer && status === 'evaluation') {
    return null;
  }
  if (status === 'evaluation') {
    return null;
  }
  const next = getNextTenderWorkflowStatus(status);
  if (!next) {
    return null;
  }
  return {
    currentLabel: getTenderWorkflowStatusLabel(status),
    nextLabel: getTenderWorkflowStatusLabel(next),
    nextStatus: next,
  };
}

export { formatWorkflowTransitionLabel } from './job-workflow-status';

export function isTenderWorkflowStatusRegression(
  fromStatus: string,
  toStatus: string,
  hasSelectedOffer: boolean,
): boolean {
  const fromIdx = getTenderWorkflowStatusIndex(fromStatus);
  const toIdx = getTenderWorkflowStatusIndex(toStatus);
  if (fromIdx < 0 || toIdx < 0) {
    return false;
  }
  if (toIdx < fromIdx) {
    return true;
  }
  if (hasSelectedOffer) {
    const minIdx = TENDER_WORKFLOW_STATUSES.indexOf('awarded');
    return toIdx < minIdx;
  }
  return false;
}
