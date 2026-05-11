import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { createClient } from '../supabase/server';

export type VerificationState = 'approved' | 'pending' | 'rejected' | 'unsubmitted';

export interface VerificationStatus {
  state: VerificationState;
  submittedAt: string | null;
  decidedAt: string | null;
  reason: string | null;
}

const EMPTY_STATUS: VerificationStatus = {
  state: 'unsubmitted',
  submittedAt: null,
  decidedAt: null,
  reason: null,
};

interface ProfileVerificationRow {
  is_verified: boolean | null;
  verification_submitted_at: string | null;
}

interface DecisionRow {
  decision: string;
  reason: string | null;
  created_at: string;
}

/**
 * Resolve a user's verification state by combining their profile snapshot with
 * the latest row in `verification_decisions`. The state machine is:
 *
 *   approved  -> user_profiles.is_verified = true
 *   pending   -> verification_submitted_at is set (and not yet decided)
 *   rejected  -> latest decision is 'rejected' and not currently pending
 *   unsubmitted -> none of the above
 *
 * Any reason / decidedAt only makes sense for a `rejected` state, but we
 * always carry them through so callers can show context if useful.
 */
export async function getUserVerificationStatus(
  userId: string,
  client?: SupabaseClient<Database>
): Promise<VerificationStatus> {
  const supabase = client ?? (await createClient());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- platform_role/verification_submitted_at not in generated types yet
  const sb = supabase as any;

  const { data: profile, error: profileErr } = await sb
    .from('user_profiles')
    .select('is_verified, verification_submitted_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    return EMPTY_STATUS;
  }

  const typedProfile = profile as ProfileVerificationRow;
  const isVerified = typedProfile.is_verified === true;
  const submittedAt = typedProfile.verification_submitted_at ?? null;

  if (isVerified) {
    return {
      state: 'approved',
      submittedAt,
      decidedAt: null,
      reason: null,
    };
  }

  if (submittedAt) {
    return {
      state: 'pending',
      submittedAt,
      decidedAt: null,
      reason: null,
    };
  }

  const { data: decisionRow } = await sb
    .from('verification_decisions')
    .select('decision, reason, created_at')
    .eq('subject_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const latest = decisionRow as DecisionRow | null;

  if (latest && latest.decision === 'rejected') {
    return {
      state: 'rejected',
      submittedAt: null,
      decidedAt: latest.created_at,
      reason: latest.reason ?? null,
    };
  }

  return EMPTY_STATUS;
}
