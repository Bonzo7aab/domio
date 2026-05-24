export type VerificationState = 'approved' | 'pending' | 'rejected' | 'unsubmitted';

export interface VerificationStatus {
  state: VerificationState;
  submittedAt: string | null;
  decidedAt: string | null;
  reason: string | null;
}
