'use client';

import * as React from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  reviewVerificationDocumentAction,
  clearVerificationDocumentReviewAction,
} from '../../app/admin/actions';
import type { DocumentReview } from '../../lib/database/admin-verification';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface DocumentReviewControlsProps {
  subjectUserId: string;
  documentKey: string;
  /** Current review for this document (if any). Drives button states and the stale hint. */
  review: DocumentReview | null;
  /** Whether the document has been re-uploaded since the review was made. */
  isStale: boolean;
}

/**
 * Per-document approve / reject controls embedded in the admin documents list.
 * Local UI only manages the rejection-reason editor; persisted state lives on
 * `user_profiles.verification_document_reviews` and re-renders via
 * `router.refresh()` after each action.
 */
export function DocumentReviewControls({
  subjectUserId,
  documentKey,
  review,
  isStale,
}: DocumentReviewControlsProps) {
  const [pending, startTransition] = React.useTransition();
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [reason, setReason] = React.useState(review?.status === 'rejected' ? review.reason ?? '' : '');

  const isApproved = review?.status === 'approved' && !isStale;
  const isRejected = review?.status === 'rejected' && !isStale;

  const submitApprove = () => {
    startTransition(async () => {
      const result = await reviewVerificationDocumentAction(subjectUserId, documentKey, 'approved');
      if (!result.ok) {
        toast.error(result.error ?? 'Nie udało się zaakceptować dokumentu.');
        return;
      }
      toast.success('Dokument zaakceptowany.');
      setShowRejectForm(false);
    });
  };

  const submitReject = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Podaj powód odrzucenia dokumentu.');
      return;
    }
    startTransition(async () => {
      const result = await reviewVerificationDocumentAction(
        subjectUserId,
        documentKey,
        'rejected',
        trimmed
      );
      if (!result.ok) {
        toast.error(result.error ?? 'Nie udało się odrzucić dokumentu.');
        return;
      }
      toast.success('Dokument odrzucony.');
      setShowRejectForm(false);
    });
  };

  const submitClear = () => {
    startTransition(async () => {
      const result = await clearVerificationDocumentReviewAction(subjectUserId, documentKey);
      if (!result.ok) {
        toast.error(result.error ?? 'Nie udało się wyczyścić oceny.');
        return;
      }
      toast.success('Ocena wyczyszczona.');
      setShowRejectForm(false);
      setReason('');
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={isApproved ? 'default' : 'outline'}
          disabled={pending}
          onClick={() => {
            if (isApproved) {
              submitClear();
            } else {
              submitApprove();
            }
          }}
          className={
            isApproved
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10'
          }
        >
          <Check className="h-3.5 w-3.5" />
          {isApproved ? 'Zaakceptowany' : 'Akceptuj'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isRejected ? 'destructive' : 'outline'}
          disabled={pending}
          onClick={() => {
            if (isRejected) {
              setShowRejectForm(true);
              setReason(review?.reason ?? '');
            } else {
              setShowRejectForm(prev => !prev);
              if (review?.status === 'rejected') {
                setReason(review.reason ?? '');
              }
            }
          }}
          className={isRejected ? '' : 'border-destructive/40 text-destructive hover:bg-destructive/10'}
        >
          <X className="h-3.5 w-3.5" />
          {isRejected ? 'Odrzucony' : 'Odrzuć'}
        </Button>
        {(isApproved || isRejected) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={submitClear}
            title="Wyczyść ocenę dokumentu"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Wyczyść
          </Button>
        )}
      </div>

      {showRejectForm && (
        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <label className="text-xs font-medium text-destructive">Powód odrzucenia dokumentu</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Np. Plik jest nieczytelny / Polisa wygasła / Brak pieczątki"
            rows={3}
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={submitReject}
              disabled={pending || !reason.trim()}
            >
              Zapisz odrzucenie
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false);
                setReason(review?.status === 'rejected' ? review.reason ?? '' : '');
              }}
              disabled={pending}
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
