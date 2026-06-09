import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { RegisterVerificationChoice } from '../../../components/RegisterVerificationChoice';

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
    </div>
  );
}

/** Post-registration step — contractors only. */
export default async function RegisterVerificationChoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/logowanie?redirectTo=/rejestracja/wybor-weryfikacji');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.user_type !== 'contractor') {
    redirect('/konto');
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterVerificationChoice />
    </Suspense>
  );
}
