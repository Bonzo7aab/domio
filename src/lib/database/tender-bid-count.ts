/**
 * Matches tenders.bids_count trigger (update_tender_bids_count):
 * counts submitted offers, excluding drafts and withdrawn (cancelled) bids.
 */
export function countsTowardTenderBidsCount(status: string): boolean {
  return status !== 'draft' && status !== 'cancelled';
}
