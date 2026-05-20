import type { AuthUser } from '../../types/auth';

/** Contractor who has not been approved by admin yet. */
export function needsVerificationAttention(user: AuthUser | null | undefined): boolean {
  return user?.userType === 'contractor' && user.isVerified !== true;
}

export function verificationMenuLabel(user: AuthUser | null | undefined): string {
  if (user?.verificationSubmittedAt) {
    return 'Status weryfikacji';
  }
  return 'Dokończ weryfikację';
}
