'use client';

import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Download,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  VerificationRejectReasonFields,
  buildRejectReasonFromFields,
} from './VerificationRejectReasonFields';
import type { VerificationRejectionReasonId } from '../../lib/verification/status';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  approveVerificationSubjectAction,
  getOcPreviewSignedUrlAction,
  rejectVerificationSubjectAction,
} from '../../app/admin/actions';
import type {
  DocumentReview,
  DocumentReviewMap,
  VerificationDocumentEntry,
} from '../../lib/database/admin-verification';

interface VerificationSubjectReviewProps {
  subjectUserId: string;
  userType: string;
  ocValidUntil: string | null;
  hasOcScan: boolean;
  documents: VerificationDocumentEntry[];
  reviews: DocumentReviewMap;
}

type DocReviewState = 'approved' | 'rejected' | 'unreviewed';

interface DocReviewSnapshot {
  key: string;
  label: string;
  state: DocReviewState;
  review: DocumentReview | null;
}

/**
 * Mirror of the staleness rule used in `VerificationDocumentList`: a review
 * stops counting once the user re-uploads the underlying file, because the
 * old verdict no longer applies to the current document.
 */
function isReviewStale(uploadedAt: string | null, review: DocumentReview | null): boolean {
  if (!review || !uploadedAt) return false;
  const docMs = Date.parse(uploadedAt);
  const reviewMs = Date.parse(review.reviewedAt);
  if (!Number.isFinite(docMs) || !Number.isFinite(reviewMs)) return false;
  return docMs > reviewMs;
}

function buildSnapshots(
  documents: VerificationDocumentEntry[],
  reviews: DocumentReviewMap
): DocReviewSnapshot[] {
  return documents.map(doc => {
    const review = reviews[doc.key] ?? null;
    const stale = isReviewStale(doc.uploadedAt, review);
    if (!review || stale) {
      return { key: doc.key, label: doc.label, state: 'unreviewed', review: null };
    }
    return {
      key: doc.key,
      label: doc.label,
      state: review.status,
      review,
    };
  });
}

function buildPrefilledRejectReason(snapshots: DocReviewSnapshot[]): string {
  const rejected = snapshots.filter(s => s.state === 'rejected' && s.review?.reason);
  if (rejected.length === 0) return '';
  return rejected.map(s => `• ${s.label}: ${s.review!.reason}`).join('\n');
}

type OcStatus = 'missing' | 'expired' | 'expiring' | 'valid' | 'unknown';

interface OcSnapshot {
  status: OcStatus;
  daysLeft: number | null;
  validUntilLabel: string | null;
}

const OC_EXPIRING_THRESHOLD_DAYS = 30;

/**
 * Decide how the admin should be alerted about the contractor's OC policy.
 * Two pieces of input drive this: whether a scan is actually attached and
 * whether the validity date has passed (or is approaching). Missing scan
 * always wins because we can't verify a policy whose document we don't have.
 */
function classifyOc(ocValidUntil: string | null, hasOcScan: boolean): OcSnapshot {
  if (!hasOcScan && !ocValidUntil) {
    return { status: 'missing', daysLeft: null, validUntilLabel: null };
  }
  if (!ocValidUntil) {
    // Scan present but no validity date set in account settings.
    return { status: 'unknown', daysLeft: null, validUntilLabel: null };
  }

  const validUntilMs = Date.parse(ocValidUntil);
  if (!Number.isFinite(validUntilMs)) {
    return { status: 'unknown', daysLeft: null, validUntilLabel: ocValidUntil };
  }

  const validUntilLabel = new Date(validUntilMs).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const daysLeft = Math.ceil((validUntilMs - Date.now()) / (24 * 60 * 60 * 1000));

  if (!hasOcScan) {
    return { status: 'missing', daysLeft, validUntilLabel };
  }
  if (daysLeft < 0) {
    return { status: 'expired', daysLeft, validUntilLabel };
  }
  if (daysLeft <= OC_EXPIRING_THRESHOLD_DAYS) {
    return { status: 'expiring', daysLeft, validUntilLabel };
  }
  return { status: 'valid', daysLeft, validUntilLabel };
}

export function VerificationSubjectReview({
  subjectUserId,
  userType,
  ocValidUntil,
  hasOcScan,
  documents,
  reviews,
}: VerificationSubjectReviewProps) {
  const snapshots = React.useMemo(() => buildSnapshots(documents, reviews), [documents, reviews]);
  const total = snapshots.length;
  const approved = snapshots.filter(s => s.state === 'approved').length;
  const rejected = snapshots.filter(s => s.state === 'rejected').length;
  const unreviewed = snapshots.filter(s => s.state === 'unreviewed').length;

  const hasDocs = total > 0;
  const allReviewed = hasDocs && unreviewed === 0;
  const isManager = userType === 'manager';
  const canApprove =
    (isManager && !hasDocs) || (allReviewed && rejected === 0);
  const canReject = !hasDocs || allReviewed;

  const documentPrefill = React.useMemo(() => buildPrefilledRejectReason(snapshots), [snapshots]);
  const [rejectReasonId, setRejectReasonId] = React.useState<VerificationRejectionReasonId | ''>('');
  const [rejectCustomReason, setRejectCustomReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const composedRejectReason = React.useMemo(
    () => buildRejectReasonFromFields(rejectReasonId, rejectCustomReason, documentPrefill),
    [rejectReasonId, rejectCustomReason, documentPrefill]
  );

  const openOc = async (mode: 'view' | 'download') => {
    setBusy(true);
    try {
      const res = await getOcPreviewSignedUrlAction(subjectUserId);
      if (!res.url) {
        toast.error(res.error ?? 'Brak podglądu OC');
        return;
      }
      if (mode === 'view') {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        return;
      }
      const sep = res.url.includes('?') ? '&' : '?';
      const filename = res.url.split('?')[0]?.split('/').pop() ?? 'oc-policy';
      const downloadUrl = `${res.url}${sep}download=${encodeURIComponent(filename)}`;
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (!canApprove) {
      toast.error('Najpierw zaakceptuj wszystkie dokumenty.');
      return;
    }
    setBusy(true);
    try {
      const res = await approveVerificationSubjectAction(subjectUserId);
      if (!res.ok) {
        toast.error(res.error ?? 'Błąd akceptacji');
        return;
      }
      toast.success('Zweryfikowano');
      window.location.href = '/admin/verification';
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!canReject) {
      toast.error('Najpierw oceń wszystkie dokumenty.');
      return;
    }
    if (!composedRejectReason?.trim()) {
      toast.error('Wybierz powód odrzucenia weryfikacji.');
      return;
    }
    setBusy(true);
    try {
      const res = await rejectVerificationSubjectAction(subjectUserId, composedRejectReason);
      if (!res.ok) {
        toast.error(res.error ?? 'Błąd odrzucenia');
        return;
      }
      toast.success('Odrzucono weryfikację');
      window.location.href = '/admin/verification';
    } finally {
      setBusy(false);
    }
  };

  const summaryTone = (() => {
    if (!hasDocs) return 'neutral';
    if (!allReviewed) return 'warning';
    if (rejected > 0) return 'danger';
    return 'success';
  })();

  const oc = classifyOc(ocValidUntil, hasOcScan);

  interface OcPalette {
    card: string;
    disc: string;
    title: string;
    icon: typeof ShieldCheck;
    badgeClass: string | null; // null -> use destructive variant
    badgeLabel: string;
    headline: string;
  }

  const ocPalette: OcPalette = (() => {
    switch (oc.status) {
      case 'valid':
        return {
          card: 'border-emerald-500/30 bg-emerald-500/5',
          disc: 'bg-emerald-500 text-white',
          title: 'text-emerald-700',
          icon: ShieldCheck,
          badgeClass:
            'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10',
          badgeLabel: 'OK',
          headline: 'Polisa OC dołączona',
        };
      case 'expiring':
        return {
          card: 'border-amber-500/40 bg-amber-500/5',
          disc: 'bg-amber-500 text-white',
          title: 'text-amber-800',
          icon: ShieldCheck,
          badgeClass:
            'border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10',
          badgeLabel: 'Sprawdź',
          headline: 'Polisa OC wkrótce wygasa',
        };
      case 'expired':
        return {
          card: 'border-destructive/40 bg-destructive/5',
          disc: 'bg-destructive text-destructive-foreground',
          title: 'text-destructive',
          icon: ShieldX,
          badgeClass: null,
          badgeLabel: 'Wymaga uwagi',
          headline: 'Polisa OC wygasła',
        };
      case 'missing':
        return {
          card: 'border-2 border-destructive/40 bg-destructive/5',
          disc: 'bg-destructive text-destructive-foreground',
          title: 'text-destructive',
          icon: ShieldX,
          badgeClass: null,
          badgeLabel: 'Wymaga uwagi',
          headline: 'Brak polisy OC',
        };
      default:
        return {
          card: 'border-amber-500/40 bg-amber-500/5',
          disc: 'bg-amber-500 text-white',
          title: 'text-amber-800',
          icon: Shield,
          badgeClass:
            'border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10',
          badgeLabel: 'Sprawdź',
          headline: 'Brak daty ważności OC',
        };
    }
  })();

  const OcIcon = ocPalette.icon;
  const ocDescription = (() => {
    switch (oc.status) {
      case 'valid':
        return 'Wykonawca dostarczył skan polisy OC i ważną datę. Możesz otworzyć plik poniżej, aby go zweryfikować.';
      case 'expiring':
        return `Polisa OC wygasa za ${oc.daysLeft ?? 0} ${
          (oc.daysLeft ?? 0) === 1 ? 'dzień' : 'dni'
        }. Zweryfikuj, czy wykonawca planuje przedłużenie.`;
      case 'expired':
        return 'Polisa OC dostępna, ale termin ważności minął. Poproś o aktualną polisę przed akceptacją.';
      case 'missing':
        return hasOcScan
          ? 'Skan polisy OC istnieje, ale brak innych danych. Sprawdź ustawienia OC wykonawcy.'
          : 'Wykonawca nie udostępnił polisy OC w ustawieniach konta. Bez polisy nie powinno się akceptować weryfikacji.';
      default:
        return 'Skan polisy OC dostępny, ale brak daty ważności. Poproś wykonawcę o uzupełnienie daty.';
    }
  })();

  return (
    <div className="space-y-6">
      {userType === 'contractor' && (
        <div className={`rounded-lg p-4 ${ocPalette.card}`}>
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${ocPalette.disc}`}
            >
              <OcIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-base font-semibold ${ocPalette.title}`}>
                  {ocPalette.headline}
                </h3>
                {ocPalette.badgeClass ? (
                  <Badge className={`${ocPalette.badgeClass} uppercase text-[10px]`}>
                    {ocPalette.badgeLabel}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="uppercase text-[10px]">
                    {ocPalette.badgeLabel}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{ocDescription}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  Ważność:&nbsp;
                  <span
                    className={`font-medium ${
                      oc.status === 'expired'
                        ? 'text-destructive'
                        : oc.status === 'expiring'
                          ? 'text-amber-800'
                          : ''
                    }`}
                  >
                    {oc.validUntilLabel ?? 'nie podano'}
                  </span>
                  {typeof oc.daysLeft === 'number' && oc.status !== 'missing' && (
                    <span className="text-muted-foreground">
                      ·{' '}
                      {oc.daysLeft < 0
                        ? `wygasła ${Math.abs(oc.daysLeft)} dni temu`
                        : oc.daysLeft === 0
                          ? 'wygasa dzisiaj'
                          : `pozostało ${oc.daysLeft} dni`}
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
                  Skan polisy:&nbsp;
                  <span className={`font-medium ${hasOcScan ? '' : 'text-destructive'}`}>
                    {hasOcScan ? 'dołączony' : 'brak'}
                  </span>
                </span>
              </div>
              {hasOcScan ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => openOc('view')}
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => openOc('download')}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" /> Pobierz
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-destructive/30 bg-background p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-destructive">Brakuje skanu polisy.</span>{' '}
                  Skan dodaje się w ustawieniach konta wykonawcy w sekcji „Ubezpieczenie OC”.
                  Bez niego oferty wykonawcy nie pojawią się publicznie.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card
        className={
          summaryTone === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : summaryTone === 'danger'
              ? 'border-destructive/30 bg-destructive/5'
              : summaryTone === 'warning'
                ? 'border-amber-500/40 bg-amber-500/5'
                : ''
        }
      >
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Decyzja końcowa</h3>
            <p className="text-sm text-muted-foreground">
              {hasDocs
                ? 'Aby zaakceptować lub odrzucić weryfikację, oceń każdy z przesłanych dokumentów.'
                : 'Użytkownik nie przesłał żadnych dokumentów weryfikacyjnych.'}
            </p>
          </div>

          {hasDocs && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="font-medium">
                Oceniono {total - unreviewed} z {total}
              </Badge>
              <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                <Check className="h-3 w-3" /> Zaakceptowane: {approved}
              </Badge>
              <Badge variant={rejected > 0 ? 'destructive' : 'outline'}>
                <X className="h-3 w-3" /> Odrzucone: {rejected}
              </Badge>
              {unreviewed > 0 && (
                <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                  <AlertTriangle className="h-3 w-3" /> Wymagają oceny: {unreviewed}
                </Badge>
              )}
            </div>
          )}

          {hasDocs && !allReviewed && (
            <div className="rounded-md border border-amber-500/30 bg-background p-3 text-sm">
              <div className="font-medium text-amber-800">
                Oceń wszystkie dokumenty zanim podejmiesz decyzję końcową.
              </div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                {snapshots
                  .filter(s => s.state === 'unreviewed')
                  .map(s => (
                    <li key={s.key}>{s.label}</li>
                  ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="default"
              disabled={busy || !canApprove}
              onClick={handleApprove}
              className={
                canApprove
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : ''
              }
              title={
                !hasDocs
                  ? 'Brak przesłanych dokumentów.'
                  : !allReviewed
                    ? 'Najpierw oceń wszystkie dokumenty.'
                    : rejected > 0
                      ? 'Nie można zaakceptować, gdy są odrzucone dokumenty.'
                      : undefined
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Akceptuj weryfikację
            </Button>
          </div>

          <div
            className={`space-y-2 rounded-lg border p-4 ${
              rejected > 0 && allReviewed
                ? 'border-destructive/40 bg-destructive/5'
                : 'border bg-background'
            }`}
          >
            <Label className="font-medium">Odrzuć weryfikację</Label>
            <p className="text-xs text-muted-foreground">
              Wybierz powód z listy — trafi do powiadomienia i e-maila użytkownika.
              {documentPrefill.trim() ? ' Uwagi z oceny dokumentów zostaną dołączone automatycznie.' : ''}
            </p>
            <VerificationRejectReasonFields
              reasonId={rejectReasonId}
              customReason={rejectCustomReason}
              onReasonIdChange={setRejectReasonId}
              onCustomReasonChange={setRejectCustomReason}
              disabled={busy}
            />
            {documentPrefill.trim() ? (
              <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground whitespace-pre-wrap">
                {documentPrefill}
              </p>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              disabled={busy || !canReject || !composedRejectReason?.trim()}
              onClick={handleReject}
              title={
                !hasDocs
                  ? 'Brak przesłanych dokumentów.'
                  : !allReviewed
                    ? 'Najpierw oceń wszystkie dokumenty.'
                    : undefined
              }
            >
              <ShieldX className="h-4 w-4" />
              Odrzuć weryfikację
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
