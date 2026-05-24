import { RefreshCw } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requirePlatformAdmin } from '../../../../lib/admin/require-platform-admin';
import { getUserVerificationStatus } from '../../../../lib/database/verification-queries';
import { VerificationSubjectHeader } from '../../../../components/admin/VerificationSubjectHeader';
import { createAdminClient } from '../../../../lib/supabase/admin';
import {
  countSubmittedDocuments,
  expectedDocumentCount,
  fetchAdminNotesForUser,
  fetchLatestDecisionAtForUser,
  fetchVerificationDocumentReviews,
  getVerificationDocumentSignedUrls,
  resolveUpdatedAt,
} from '../../../../lib/database/admin-verification';
import { VerificationSubjectReview } from '../../../../components/admin/VerificationSubjectReview';
import { VerificationDocumentList } from '../../../../components/admin/VerificationDocumentList';
import { AdminUserNotes } from '../../../../components/admin/AdminUserNotes';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminVerificationSubjectPage({ params }: PageProps) {
  const { userId } = await params;
  const { supabase } = await requirePlatformAdmin(`/admin/verification/${userId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: profile, error } = await sb
    .from('user_profiles')
    .select(
      `
      id,
      first_name,
      last_name,
      user_type,
      phone,
      verification_submitted_at,
      verification_document_paths,
      is_verified,
      created_at,
      updated_at,
      user_companies (
        is_primary,
        companies (
          id,
          name,
          type,
          nip,
          email,
          phone,
          city
        )
      )
    `
    )
    .eq('id', userId)
    .single();

  if (error || !profile) {
    notFound();
  }

  const notes = await fetchAdminNotesForUser(supabase, userId);

  const adminClient = createAdminClient();
  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  const email = authUser.user?.email ?? null;

  let ocValidUntil: string | null = null;
  let ocPolicyScanPath: string | null = null;

  if (profile.user_type === 'contractor') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cas, error: casError } = await (adminClient as any)
      .from('contractor_account_settings')
      .select('oc_valid_until, oc_policy_scan_path')
      .eq('user_id', userId)
      .maybeSingle();
    if (casError) {
      console.error('[admin/verification] contractor_account_settings read failed', {
        userId,
        code: casError.code,
        message: casError.message,
      });
    }
    ocValidUntil = (cas?.oc_valid_until as string) ?? null;
    ocPolicyScanPath = (cas?.oc_policy_scan_path as string) ?? null;
  }

  const docPaths: Record<string, string> = {
    ...((profile.verification_document_paths as Record<string, string> | null | undefined) ?? {}),
  };
  if (profile.user_type === 'contractor' && !docPaths.insurance && ocPolicyScanPath) {
    docPaths.insurance = ocPolicyScanPath;
  }

  const userType = (profile.user_type as string) ?? '';
  const paths = profile.verification_document_paths as Record<string, string> | null | undefined;
  const documentsSubmitted = countSubmittedDocuments(userType, paths);
  const documentsExpected = expectedDocumentCount(userType);

  const ucs = (profile.user_companies ?? []) as Array<{
    is_primary?: boolean;
    companies?: {
      name?: string;
      nip?: string;
      email?: string;
      phone?: string;
      city?: string;
    };
  }>;
  const primary = ucs.find((uc) => uc.is_primary) ?? ucs[0];
  const company = primary?.companies;

  const [documents, lastDecisionAt, reviews, verificationStatus] = await Promise.all([
    getVerificationDocumentSignedUrls(supabase, docPaths),
    fetchLatestDecisionAtForUser(supabase, userId),
    fetchVerificationDocumentReviews(supabase, userId),
    getUserVerificationStatus(userId, supabase),
  ]);

  return (
    <div className="space-y-6">
      <VerificationSubjectHeader
        firstName={(profile.first_name as string) ?? ''}
        lastName={(profile.last_name as string) ?? ''}
        userType={userType}
        verificationState={verificationStatus.state}
        rejectionReason={verificationStatus.reason}
        email={email ?? company?.email ?? null}
        phone={(profile.phone as string | null) ?? company?.phone ?? null}
        companyName={company?.name ?? null}
        companyNip={company?.nip ?? null}
        companyCity={company?.city ?? null}
        documentsSubmitted={documentsSubmitted}
        documentsExpected={documentsExpected}
        createdAt={(profile.created_at as string | null) ?? null}
        updatedAt={resolveUpdatedAt(
          profile.updated_at as string | null,
          profile.verification_submitted_at as string | null,
          paths
        )}
        submittedAt={(profile.verification_submitted_at as string | null) ?? null}
        notesCount={notes.length}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Dokumenty</CardTitle>
            {(() => {
              if (!lastDecisionAt) return null;
              const updatedCount = documents.filter(
                (d) => d.uploadedAt && Date.parse(d.uploadedAt) > Date.parse(lastDecisionAt)
              ).length;
              if (updatedCount === 0) {
                return (
                  <Badge variant="outline" className="text-xs">
                    Brak zmian od ostatniej decyzji
                  </Badge>
                );
              }
              return (
                <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 text-xs">
                  <RefreshCw className="h-3 w-3" />
                  {updatedCount} z {documents.length}{' '}
                  {documents.length === 1 ? 'dokument' : 'dokumentów'} zaktualizowanych
                </Badge>
              );
            })()}
          </div>
          {lastDecisionAt && (
            <p className="text-xs text-muted-foreground">
              Ostatnia decyzja: {new Date(lastDecisionAt).toLocaleString('pl-PL')}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <VerificationDocumentList
            documents={documents}
            updatedSince={lastDecisionAt}
            reviews={reviews}
            subjectUserId={userId}
            ocValidUntil={profile.user_type === 'contractor' ? ocValidUntil : null}
          />
        </CardContent>
      </Card>

      <VerificationSubjectReview
        subjectUserId={userId}
        userType={profile.user_type}
        ocValidUntil={ocValidUntil}
        hasOcScan={Boolean(ocPolicyScanPath)}
        documents={documents}
        reviews={reviews}
      />

      <Card id="admin-notes" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-base">Notatki wewnętrzne</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUserNotes subjectUserId={userId} notes={notes} variant="section" />
        </CardContent>
      </Card>
    </div>
  );
}
