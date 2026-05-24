import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { getUserVerificationStatus } from '../database/verification-queries';

export async function canUserUsePlatformFeatures(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ allowed: boolean; message?: string }> {
  const status = await getUserVerificationStatus(userId, supabase);
  if (status.state === 'approved') {
    return { allowed: true };
  }
  if (status.state === 'rejected') {
    return {
      allowed: false,
      message:
        status.reason ??
        'Twoje konto zostało odrzucone. Skontaktuj się z administratorem lub popraw dane i prześlij dokumenty ponownie.',
    };
  }
  return {
    allowed: false,
    message:
      'Twoje konto oczekuje na weryfikację przez administratora. Funkcja będzie dostępna po akceptacji.',
  };
}
