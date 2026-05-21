import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

/** Verification documents moved to /account?tab=documents for contractors. */
export default async function Verification() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/account?tab=documents');
  }

  redirect('/account?tab=documents');
}
