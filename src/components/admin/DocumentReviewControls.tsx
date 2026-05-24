'use client';

import * as React from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  reviewVerificationDocumentAction,
  clearVerificationDocumentReviewAction,
} from '../../app/admin/actions';
import type { DocumentReview } from '../../lib/database/admin-verification';
import type { DocumentRejectionReasonId } from '../../lib/verification/status';
import { Button } from '../ui/button';
import {
  DocumentRejectReasonFields,
  buildDocumentRejectReason,
} from './DocumentRejectReasonFields';

interface DocumentReviewControlsProps {
  subjectUserId: string;
  documentKey: string;
  review: DocumentReview | null;
  isStale: boolean;
}

export function DocumentReviewControls({
  subjectUserId,
  documentKey,
  review,
  isStale,
}: DocumentReviewControlsProps) {
  const [pending, startTransition] = React.useTransition();
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [reasonId, setReasonId] = React.useState<DocumentRejectionReasonId | ''>('');
  const [customReason, setCustomReason] = React.useState('');

  const isApproved = review?.status === 'approved' && !isStale;
  const isRejected = review?.status === 'rejected' && !isStale;

  const composedReason = React.useMemo(
    () => buildDocumentRejectReason(reasonId, customReason),
    [reasonId, customReason]
  );

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
    if (!composedReason?.trim()) {
      toast.error('Wybierz powód odrzucenia dokumentu.');
      return;
    }
    startTransition(async () => {
      const result = await reviewVerificationDocumentAction(
        subjectUserId,
        documentKey,
        'rejected',
        composedReason
      );
      if (!result.ok) {
        toast.error(result.error ?? 'Nie udało się odrzucić dokumentu.');
        return;
      }
      toast.success('Dokument odrzucony.');
      setShowRejectForm(false);
      setReasonId('');
      setCustomReason('');
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
      setReasonId('');
      setCustomReason('');
    });
  };

  const openRejectForm = () => {
    setShowRejectForm(true);
    if (review?.status === 'rejected' && review.reason) {
      setCustomReason(review.reason);
      setReasonId('other');
    }
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
              openRejectForm();
            } else {
              setShowRejectForm((prev) => !prev);
              if (!showRejectForm) {
                setReasonId('');
                setCustomReason('');
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
        <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <DocumentRejectReasonFields
            reasonId={reasonId}
            customReason={customReason}
            onReasonIdChange={setReasonId}
            onCustomReasonChange={setCustomReason}
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={submitReject}
              disabled={pending || !composedReason?.trim()}
            >
              Zapisz odrzucenie
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false);
                setReasonId('');
                setCustomReason('');
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
