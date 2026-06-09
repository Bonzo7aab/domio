import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

/** Verification documents moved to /konto?tab=documents for contractors. */
export default async function Verification() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/logowanie?redirectTo=/konto?tab=documents');
  }

  redirect('/konto?tab=documents');
}
