import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getUserVerificationStatus } from '../../lib/database/verification';
import {
  fetchVerificationDocumentReviews,
  getVerificationDocumentSignedUrls,
  type VerificationDocumentEntry,
} from '../../lib/database/admin-verification';
import { VerificationPage } from '../../components/VerificationPage';

export default async function Verification() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/verification');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: profileRow } = await sb
    .from('user_profiles')
    .select('user_type, verification_document_paths')
    .eq('id', user.id)
    .maybeSingle();

  const userType = (profileRow?.user_type as string | null) ?? null;
  if (userType === 'manager') {
    redirect('/account');
  }

  const status = await getUserVerificationStatus(user.id, supabase);

  const docPaths = (profileRow?.verification_document_paths ?? {}) as Record<string, string>;

  if (userType === 'contractor' && !docPaths.insurance) {
    const { data: cas } = await sb
      .from('contractor_account_settings')
      .select('oc_policy_scan_path')
      .eq('user_id', user.id)
      .maybeSingle();
    const ocPath = (cas?.oc_policy_scan_path as string | null) ?? null;
    if (ocPath) {
      docPaths.insurance = ocPath;
    }
  }

  const [existingDocuments, reviews]: [VerificationDocumentEntry[], Awaited<ReturnType<typeof fetchVerificationDocumentReviews>>] =
    await Promise.all([
      getVerificationDocumentSignedUrls(supabase, docPaths),
      fetchVerificationDocumentReviews(supabase, user.id),
    ]);

  return (
    <VerificationPage
      initialStatus={status}
      existingDocuments={existingDocuments}
      documentReviews={reviews}
    />
  );
}
