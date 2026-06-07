'use client';

import { useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import { updateCompanyReview } from '../../lib/database/reviews';
import { StarRatingInput } from './StarRatingInput';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface WrittenReviewEditPanelProps {
  reviewId: string;
  counterpartyName: string;
  initialRating: number;
  initialComment: string;
  onSaved?: (updated: { rating: number; comment: string }) => void;
}

export function WrittenReviewEditPanel({
  reviewId,
  counterpartyName,
  initialRating,
  initialComment,
  onSaved,
}: WrittenReviewEditPanelProps): ReactElement {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (rating === 0) {
      toast.error('Wybierz ocenę od 1 do 5 gwiazdek');
      return;
    }
    if (!comment.trim()) {
      toast.error('Dodaj komentarz');
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

      const { error } = await updateCompanyReview(supabase, reviewId, user.id, {
        rating,
        comment,
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Ocena została zaktualizowana');
      onSaved?.({ rating, comment: comment.trim() });
    } catch {
      toast.error('Wystąpił błąd podczas zapisywania oceny');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-foreground">
        Twoja ocena dla {counterpartyName}
      </p>

      <StarRatingInput label="Twoja ocena" rating={rating} onRatingChange={setRating} />

      <div>
        <Label htmlFor={`written-review-comment-${reviewId}`}>Komentarz *</Label>
        <Textarea
          id={`written-review-comment-${reviewId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="mt-1 resize-none"
        />
      </div>

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting || rating === 0 || !comment.trim()}
      >
        {submitting ? 'Zapisywanie…' : 'Zapisz zmiany'}
      </Button>
    </div>
  );
}
