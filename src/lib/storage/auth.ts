'use server';

import { createClient } from '../supabase/server';

export async function requireAuthenticatedUser(expectedUserId?: string): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Musisz być zalogowany.');
  }

  if (expectedUserId && user.id !== expectedUserId) {
    throw new Error('Brak uprawnień do wykonania tej operacji.');
  }

  return { id: user.id };
}
