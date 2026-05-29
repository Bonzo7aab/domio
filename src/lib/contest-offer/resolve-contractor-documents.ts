import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export async function loadContractorReferencesPrefill(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('bio, experience_summary')
    .eq('id', userId)
    .maybeSingle();

  const parts: string[] = [];
  if (profile?.experience_summary && typeof profile.experience_summary === 'string') {
    parts.push(profile.experience_summary);
  }
  if (profile?.bio && typeof profile.bio === 'string') {
    parts.push(profile.bio);
  }
  return parts.join('\n\n').trim();
}
