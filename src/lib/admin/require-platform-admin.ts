import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';

export interface PlatformAdminSession {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | undefined;
}

/**
 * Ensures the current user is authenticated and has platform_role = platform_admin.
 */
export async function requirePlatformAdmin(redirectTo = '/admin'): Promise<PlatformAdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.platform_role !== 'platform_admin') {
    redirect('/');
  }

  return {
    supabase,
    userId: user.id,
    email: user.email,
  };
}
