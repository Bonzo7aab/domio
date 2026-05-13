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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: profileRow } = await sb
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  const isContractor = profileRow?.user_type === 'contractor';
  const isManager = profileRow?.user_type === 'manager';

  const verificationStatus = isManager
    ? {
        state: 'approved' as const,
        submittedAt: null,
        decidedAt: null,
        reason: null,
      }
    : await getUserVerificationStatus(user.id, supabase);

  let ocValidUntil: string | null = null;
  let hasOcScan = false;
  if (isContractor) {
    const [casResult, profileDocsResult] = await Promise.all([
      sb
        .from('contractor_account_settings')
        .select('oc_valid_until, oc_policy_scan_path')
        .eq('user_id', user.id)
        .maybeSingle(),
      sb
        .from('user_profiles')
        .select('verification_document_paths')
        .eq('id', user.id)
        .maybeSingle(),
    ]);
    ocValidUntil = (casResult.data?.oc_valid_until as string | null) ?? null;
    const accountOcPath = (casResult.data?.oc_policy_scan_path as string | null) ?? null;
    const verificationPaths =
      (profileDocsResult.data?.verification_document_paths as Record<string, string> | null | undefined) ?? {};
    hasOcScan = Boolean(accountOcPath || verificationPaths.insurance);
  }

  return (
    <UserAccountPageClient
      verificationStatus={verificationStatus}
      ocOnboarding={isContractor ? { ocValidUntil, hasOcScan } : null}
    />
  );
}
