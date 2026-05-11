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

  const status = await getUserVerificationStatus(user.id, supabase);

  // Pull this user's stored verification document paths (subject to RLS) and
  // mint short-lived signed URLs for view + download. Helper lives under
  // admin-verification but does not itself require admin auth.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: profileRow } = await sb
    .from('user_profiles')
    .select('verification_document_paths')
    .eq('id', user.id)
    .maybeSingle();

  const docPaths = (profileRow?.verification_document_paths ?? {}) as Record<string, string>;
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
