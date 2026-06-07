'use client';

import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import {
  createCompanyReview,
  fetchReviewByReviewerAndTender,
  updateCompanyReview,
  type CompanyReviewRecord,
} from '../../lib/database/reviews';
import { StarRatingInput } from './StarRatingInput';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export type CooperationReviewVariant = 'manager' | 'contractor';

const COMMENT_PLACEHOLDERS: Record<CooperationReviewVariant, string> = {
  manager:
    'Napisz krótko: Jak oceniasz jakość prac, komunikacje, terminowość odbioru i organizacje?',
  contractor:
    'Napisz krótko: Jak oceniasz jakość dokumentacji, komunikacje, terminowość płatności i organizacje?',
};

interface CooperationReviewPanelProps {
  variant: CooperationReviewVariant;
  tenderId: string;
  counterpartyCompanyId: string;
  counterpartyCompanyName: string;
  onSubmitted?: (updated: { rating: number; comment: string }) => void;
}

export function CooperationReviewPanel({
  variant,
  tenderId,
  counterpartyCompanyId,
  counterpartyCompanyName,
  onSubmitted,
}: CooperationReviewPanelProps): ReactElement {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [existing, setExisting] = useState<CompanyReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const review = await fetchReviewByReviewerAndTender(supabase, user.id, tenderId);
    setExisting(review);
    if (review) {
      setRating(review.rating);
      setComment(review.comment ?? '');
    } else {
      setRating(0);
      setComment('');
    }
    setLoading(false);
  }, [tenderId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const handleSubmit = async (): Promise<void> => {
    if (rating === 0) {
      toast.error('Wybierz ocenę od 1 do 5 gwiazdek');
      return;
    }
    if (!comment.trim()) {
      toast.error('Dodaj komentarz');
      return;
    }
    if (!counterpartyCompanyId) {
      toast.error('Brak danych firmy do oceny');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Musisz być zalogowany');
        return;
      }

      if (existing) {
        const { error } = await updateCompanyReview(supabase, existing.id, user.id, {
          rating,
          comment,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Ocena współpracy została zaktualizowana');
      } else {
        const { error } = await createCompanyReview(supabase, counterpartyCompanyId, user.id, {
          rating,
          comment,
          tenderId,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Ocena współpracy została zapisana');
      }

      await loadExisting();
      onSubmitted?.({ rating, comment: comment.trim() });
    } catch {
      toast.error('Wystąpił błąd podczas zapisywania oceny');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Ładowanie…</p>;
  }

  const isEditing = existing !== null;

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-foreground">
        {isEditing
          ? `Twoja ocena współpracy z ${counterpartyCompanyName}`
          : `Jak oceniasz współpracę z ${counterpartyCompanyName}?`}
      </p>

      <StarRatingInput label="Twoja ocena" rating={rating} onRatingChange={setRating} />

      <div>
        <Label htmlFor={`cooperation-review-comment-${tenderId}`}>Komentarz *</Label>
        <Textarea
          id={`cooperation-review-comment-${tenderId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={COMMENT_PLACEHOLDERS[variant]}
          rows={4}
          className="mt-1 resize-none"
        />
      </div>

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting || rating === 0 || !comment.trim()}
      >
        {submitting ? 'Zapisywanie…' : isEditing ? 'Zapisz zmiany' : 'Wyślij ocenę'}
      </Button>
    </div>
  );
}
