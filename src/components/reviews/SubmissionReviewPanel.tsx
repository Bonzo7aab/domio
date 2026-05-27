'use client';

import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import {
  createCompanyReview,
  fetchReviewByReviewerAndJob,
  type CompanyReviewRecord,
} from '../../lib/database/reviews';
import { StarRatingInput } from './StarRatingInput';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';

interface SubmissionReviewPanelProps {
  jobId: string;
  managerCompanyId: string;
  managerCompanyName: string;
  onSubmitted?: () => void;
}

export function SubmissionReviewPanel({
  jobId,
  managerCompanyId,
  managerCompanyName,
  onSubmitted,
}: SubmissionReviewPanelProps): ReactElement {
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
    const review = await fetchReviewByReviewerAndJob(supabase, user.id, jobId);
    setExisting(review);
    setLoading(false);
  }, [jobId]);

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

      const { error } = await createCompanyReview(supabase, managerCompanyId, user.id, {
        rating,
        comment,
        jobId,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Opinia o konkursie została zapisana');
      await loadExisting();
      onSubmitted?.();
    } catch {
      toast.error('Wystąpił błąd podczas zapisywania opinii');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Ładowanie…</p>;
  }

  if (existing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Opinia o konkursie <strong>{managerCompanyName}</strong> została już wystawiona.
          </p>
          <div className="flex items-center gap-1 text-amber-600 font-semibold">
            {'★'.repeat(existing.rating)}
            <span className="text-foreground font-normal ml-2">{existing.rating}/5</span>
          </div>
          {existing.comment && (
            <p className="text-sm whitespace-pre-wrap">{existing.comment}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(existing.createdAt).toLocaleDateString('pl-PL')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Oceń konkurs organizatora <strong>{managerCompanyName}</strong>.
      </p>

      <StarRatingInput label="Ocena konkursu" rating={rating} onRatingChange={setRating} />

      <div>
        <Label htmlFor="submission-review-comment">Komentarz *</Label>
        <Textarea
          id="submission-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Opisz swoje doświadczenie z konkursem…"
          rows={4}
          className="mt-1 resize-none"
        />
      </div>

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting || rating === 0 || !comment.trim()}
      >
        {submitting ? 'Zapisywanie…' : 'Wyślij ocenę konkursu'}
      </Button>
    </div>
  );
}
