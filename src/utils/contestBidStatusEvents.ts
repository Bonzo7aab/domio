export const CONTEST_BID_STATUS_CHANGED_EVENT = 'domio:contest-bid-status-changed';

export type ContestBidStatusChange =
  | { tenderId: string; status: 'submitted' }
  | { tenderId: string; status: 'draft' }
  | { tenderId: string; status: 'none' };

export function notifyContestBidStatusChanged(change: ContestBidStatusChange): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ContestBidStatusChange>(CONTEST_BID_STATUS_CHANGED_EVENT, {
      detail: change,
    }),
  );
}
