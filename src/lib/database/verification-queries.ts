import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { VerificationStatus } from '../verification/types';

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
 * Resolve verification state from profile + latest decision (client-safe — pass Supabase).
 */
export async function getUserVerificationStatus(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<VerificationStatus> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: profile, error: profileErr } = await sb
    .from('user_profiles')
    .select('user_type, is_verified, verification_submitted_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    return EMPTY_STATUS;
  }

  const typedProfile = profile as ProfileVerificationRow & { user_type?: string | null };
  if (typedProfile.user_type === 'manager') {
    return {
      state: 'approved',
      submittedAt: typedProfile.verification_submitted_at ?? null,
      decidedAt: null,
      reason: null,
    };
  }

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

  const { data: decisionRow } = await sb
    .from('verification_decisions')
    .select('decision, reason, created_at')
    .eq('subject_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const latest = decisionRow as DecisionRow | null;

  if (latest?.decision === 'rejected' && !submittedAt) {
    return {
      state: 'rejected',
      submittedAt: null,
      decidedAt: latest.created_at,
      reason: latest.reason ?? null,
    };
  }

  return {
    state: 'pending',
    submittedAt,
    decidedAt: null,
    reason: null,
  };
}
