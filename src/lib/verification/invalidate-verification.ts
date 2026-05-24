import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

/**
 * Reset profile/company verification after the user changes data that requires
 * a fresh admin review (OPD-45).
 */
export async function invalidateUserVerification(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: profile } = await sb
    .from('user_profiles')
    .select('is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.is_verified) {
    return;
  }

  const { data: companyRelation } = await sb
    .from('user_companies')
    .select('company_id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle();

  const companyId = companyRelation?.company_id as string | undefined;

  await sb
    .from('user_profiles')
    .update({
      is_verified: false,
      verification_submitted_at: null,
    })
    .eq('id', userId);

  if (companyId) {
    await sb
      .from('companies')
      .update({
        is_verified: false,
        verification_level: 'none',
      })
      .eq('id', companyId);
  }
}
