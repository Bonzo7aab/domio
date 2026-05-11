import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getUserVerificationStatus } from '../../lib/database/verification';
import { UserAccountPageClient } from '../../components/UserAccountPageClient';

export default async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/account');
  }

  const verificationStatus = await getUserVerificationStatus(user.id, supabase);

  // Pull contractor OC settings server-side so the onboarding notice doesn't
  // need a follow-up client fetch. Managers don't have OC, so we skip the read.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: profileRow } = await sb
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  const isContractor = profileRow?.user_type === 'contractor';
  let ocValidUntil: string | null = null;
  let hasOcScan = false;
  if (isContractor) {
    const { data: cas } = await sb
      .from('contractor_account_settings')
      .select('oc_valid_until, oc_policy_scan_path')
      .eq('user_id', user.id)
      .maybeSingle();
    ocValidUntil = (cas?.oc_valid_until as string | null) ?? null;
    hasOcScan = Boolean(cas?.oc_policy_scan_path);
  }

  return (
    <UserAccountPageClient
      verificationStatus={verificationStatus}
      ocOnboarding={isContractor ? { ocValidUntil, hasOcScan } : null}
    />
  );
}
