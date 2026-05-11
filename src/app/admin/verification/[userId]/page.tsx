import { CalendarClock, RefreshCw, ShieldCheck, ShieldX } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requirePlatformAdmin } from '../../../../lib/admin/require-platform-admin';
import { createAdminClient } from '../../../../lib/supabase/admin';
import {
  fetchAdminNotesForUser,
  fetchLatestDecisionAtForUser,
  fetchVerificationDocumentReviews,
  getVerificationDocumentSignedUrls,
} from '../../../../lib/database/admin-verification';
import { VerificationSubjectReview } from '../../../../components/admin/VerificationSubjectReview';
import { VerificationDocumentList } from '../../../../components/admin/VerificationDocumentList';
import { AdminUserNotes } from '../../../../components/admin/AdminUserNotes';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

interface PageProps {
  params: Promise<{ userId: string }>;
}

function userTypeLabel(value: string | null): string {
  switch (value) {
    case 'manager':
      return 'Zarządca';
    case 'contractor':
      return 'Wykonawca';
    default:
      return value ?? '—';
  }
}

function userInitials(first: string | null, last: string | null): string {
  const f = (first ?? '').trim().charAt(0).toUpperCase();
  const l = (last ?? '').trim().charAt(0).toUpperCase();
  return `${f}${l}` || '?';
}

export default async function AdminVerificationSubjectPage({ params }: PageProps) {
  const { userId } = await params;
  const { supabase } = await requirePlatformAdmin(`/admin/verification/${userId}`);

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(
      'id, first_name, last_name, user_type, verification_submitted_at, verification_document_paths, is_verified'
    )
    .eq('id', userId)
    .single();

  if (error || !profile) {
    notFound();
  }

  const notes = await fetchAdminNotesForUser(supabase, userId);

  let ocValidUntil: string | null = null;
  let ocPolicyScanPath: string | null = null;

  if (profile.user_type === 'contractor') {
    // Use the service-role client here: RLS is already enforced upstream by
    // `requirePlatformAdmin`, and we want this read to be insensitive to any
    // policy/auth-context quirks. The columns are non-sensitive (scan path +
    // expiry date) and the admin needs to see them to make a decision.
    const adminClient = createAdminClient();
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
  // Pull contractor OC scan into the doc list when the contractor only set it
  // through /account?tab=contractor-data. Keeps the admin view aligned with
  // the user's actual OC state without requiring a backfill.
  if (profile.user_type === 'contractor' && !docPaths.insurance && ocPolicyScanPath) {
    docPaths.insurance = ocPolicyScanPath;
  }

  const [documents, lastDecisionAt, reviews] = await Promise.all([
    getVerificationDocumentSignedUrls(supabase, docPaths),
    fetchLatestDecisionAtForUser(supabase, userId),
    fetchVerificationDocumentReviews(supabase, userId),
  ]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
            >
              {userInitials(profile.first_name, profile.last_name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {profile.first_name} {profile.last_name}
              </h2>
              {profile.verification_submitted_at && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Przesłano: {new Date(profile.verification_submitted_at).toLocaleString('pl-PL')}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {userTypeLabel(profile.user_type)}
            </Badge>
            {profile.is_verified ? (
              <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Profil zweryfikowany
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm">
                <ShieldX className="h-3.5 w-3.5" />
                Profil niezweryfikowany
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-2 py-2">
        <CardContent className="space-y-1.5 px-3 py-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notatki
          </CardTitle>
          <AdminUserNotes subjectUserId={userId} notes={notes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Dokumenty</CardTitle>
            {(() => {
              if (!lastDecisionAt) return null;
              const updatedCount = documents.filter(
                d =>
                  d.uploadedAt &&
                  Date.parse(d.uploadedAt) > Date.parse(lastDecisionAt)
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
    </div>
  );
}
