import {
  CalendarClock,
  CalendarDays,
  Check,
  Download,
  ExternalLink,
  History,
  RefreshCw,
  X,
} from 'lucide-react';
import type {
  DocumentReview,
  DocumentReviewMap,
  VerificationDocumentEntry,
} from '../../lib/database/admin-verification';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DocumentReviewControls } from './DocumentReviewControls';

interface VerificationDocumentListProps {
  documents: VerificationDocumentEntry[];
  emptyMessage?: string;
  /**
   * Timestamp of the most recent admin decision for the subject. Documents
   * uploaded strictly after this point are highlighted with a "Zaktualizowany"
   * badge so the admin can quickly see what changed since their last review.
   * Pass `null` for first-time submissions (nothing is highlighted because
   * everything is new by definition).
   */
  updatedSince?: string | null;
  /**
   * Per-document admin annotations keyed by document type. When provided
   * together with `subjectUserId`, the list renders Approve / Reject controls
   * and current-review badges next to each document.
   */
  reviews?: DocumentReviewMap;
  subjectUserId?: string;
  /**
   * OC policy validity date (ISO `YYYY-MM-DD` from
   * `contractor_account_settings.oc_valid_until`). When provided, it is
   * rendered next to the `insurance` row so admins see OC expiry inline with
   * the document review controls. Contractor-only data; pass `null` for
   * managers.
   */
  ocValidUntil?: string | null;
}

const OC_EXPIRING_THRESHOLD_DAYS = 30;

interface OcValidityInfo {
  label: string;
  status: 'valid' | 'expiring' | 'expired' | 'unparseable';
  daysLeft: number | null;
}

function formatDateOnly(value: string): string | null {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function computeOcValidity(ocValidUntil: string | null | undefined): OcValidityInfo | null {
  if (!ocValidUntil) return null;
  const label = formatDateOnly(ocValidUntil);
  const ms = Date.parse(ocValidUntil);
  if (!Number.isFinite(ms) || !label) {
    return { label: ocValidUntil, status: 'unparseable', daysLeft: null };
  }
  const daysLeft = Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return { label, status: 'expired', daysLeft };
  if (daysLeft <= OC_EXPIRING_THRESHOLD_DAYS) return { label, status: 'expiring', daysLeft };
  return { label, status: 'valid', daysLeft };
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function isUpdatedSince(uploadedAt: string | null, since: string | null | undefined): boolean {
  if (!since || !uploadedAt) return false;
  const a = Date.parse(uploadedAt);
  const b = Date.parse(since);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a > b;
}

/**
 * A document review is "stale" when the user re-uploaded the document AFTER
 * the admin reviewed it. The stored review still reflects the old version,
 * so the UI hides the green/red status badge and prompts a re-evaluation.
 */
function isReviewStale(uploadedAt: string | null, review: DocumentReview | null): boolean {
  if (!review) return false;
  if (!uploadedAt) return false;
  const docMs = Date.parse(uploadedAt);
  const reviewMs = Date.parse(review.reviewedAt);
  if (!Number.isFinite(docMs) || !Number.isFinite(reviewMs)) return false;
  return docMs > reviewMs;
}

export function VerificationDocumentList({
  documents,
  emptyMessage = 'Brak przesłanych dokumentów.',
  updatedSince = null,
  reviews,
  subjectUserId,
  ocValidUntil = null,
}: VerificationDocumentListProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const showControls = Boolean(subjectUserId);
  const ocValidity = computeOcValidity(ocValidUntil);

  return (
    <ul className="space-y-3">
      {documents.map((doc) => {
        const isMissing = Boolean(doc.missing);
        const updated = !isMissing && isUpdatedSince(doc.uploadedAt, updatedSince);
        const uploadedLabel = formatDateTime(doc.uploadedAt);
        const review = (reviews && reviews[doc.key]) ?? null;
        const stale = !isMissing && isReviewStale(doc.uploadedAt, review);
        const isApprovedFresh = review?.status === 'approved' && !stale;
        const isRejectedFresh = review?.status === 'rejected' && !stale;

        const rowClasses = (() => {
          if (isMissing) return 'border-dashed bg-muted/30';
          if (isApprovedFresh) return 'border-emerald-500/40 bg-emerald-500/5';
          if (isRejectedFresh) return 'border-destructive/40 bg-destructive/5';
          if (updated) return 'border-amber-500/40 bg-amber-500/5';
          return '';
        })();

        return (
          <li
            key={doc.key}
            className={`flex flex-col gap-3 rounded-lg border bg-background p-3 ${rowClasses}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{doc.label}</span>
                  {isMissing && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Brak w profilu
                    </Badge>
                  )}
                  {isApprovedFresh && (
                    <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                      <Check className="h-3 w-3" />
                      Zaakceptowany
                    </Badge>
                  )}
                  {isRejectedFresh && (
                    <Badge variant="destructive">
                      <X className="h-3 w-3" />
                      Odrzucony
                    </Badge>
                  )}
                  {stale && review && (
                    <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                      <History className="h-3 w-3" />
                      Wymaga ponownej oceny
                    </Badge>
                  )}
                  {updated && (
                    <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                      <RefreshCw className="h-3 w-3" />
                      Zaktualizowany
                    </Badge>
                  )}
                </div>
                {!isMissing && (
                  <div className="truncate text-xs text-muted-foreground" title={doc.filename}>
                    {doc.filename}
                  </div>
                )}
                {!isMissing && uploadedLabel && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    Przesłano: {uploadedLabel}
                  </div>
                )}
                {doc.key === 'insurance' && !isMissing && (
                  <div
                    className={`mt-0.5 flex flex-wrap items-center gap-1 text-xs ${
                      ocValidity?.status === 'expired'
                        ? 'text-destructive'
                        : ocValidity?.status === 'expiring'
                          ? 'text-amber-700'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <CalendarDays className="h-3 w-3" />
                    Ważność OC:{' '}
                    {ocValidity ? (
                      <>
                        <span className="font-medium">{ocValidity.label}</span>
                        {typeof ocValidity.daysLeft === 'number' &&
                          ocValidity.status !== 'unparseable' && (
                            <span className="text-muted-foreground">
                              ·{' '}
                              {ocValidity.daysLeft < 0
                                ? `wygasła ${Math.abs(ocValidity.daysLeft)} dni temu`
                                : ocValidity.daysLeft === 0
                                  ? 'wygasa dzisiaj'
                                  : `pozostało ${ocValidity.daysLeft} dni`}
                            </span>
                          )}
                      </>
                    ) : (
                      <span className="font-medium text-destructive">nie podano</span>
                    )}
                  </div>
                )}
                {doc.error && !isMissing && <div className="text-xs text-destructive">{doc.error}</div>}
              </div>
              {!isMissing && (
                <div className="flex flex-wrap gap-2 sm:items-start">
                <Button asChild type="button" size="sm" variant="outline" disabled={!doc.viewUrl}>
                  {doc.viewUrl ? (
                    <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
                    </a>
                  ) : (
                    <span>
                      <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
                    </span>
                  )}
                </Button>
                <Button
                  asChild
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!doc.downloadUrl}
                >
                  {doc.downloadUrl ? (
                    <a href={doc.downloadUrl} download={doc.filename}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Pobierz
                    </a>
                  ) : (
                    <span>
                      <Download className="mr-1 h-3.5 w-3.5" /> Pobierz
                    </span>
                  )}
                </Button>
                </div>
              )}
            </div>

            {/* Active reason (rejection) */}
            {!isMissing && isRejectedFresh && review?.reason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
                <span className="font-medium">Powód:</span> {review.reason}
              </div>
            )}

            {/* Stale review breadcrumb so we keep an audit trail before the new evaluation */}
            {!isMissing && stale && review && (
              <div className="rounded-md border border-amber-500/30 bg-background p-2 text-xs text-muted-foreground">
                <span className="font-medium">
                  Poprzednia ocena ({review.status === 'approved' ? 'zaakceptowany' : 'odrzucony'}):
                </span>{' '}
                {formatDateTime(review.reviewedAt)}
                {review.reason ? ` — ${review.reason}` : ''}
              </div>
            )}

            {!isMissing && showControls && subjectUserId && (
              <DocumentReviewControls
                subjectUserId={subjectUserId}
                documentKey={doc.key}
                review={review}
                isStale={stale}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
