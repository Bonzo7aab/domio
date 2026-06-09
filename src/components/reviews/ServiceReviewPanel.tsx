'use client';

import { useCallback, useEffect, useState, type ReactElement } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import {
  createCompanyReview,
  fetchReviewByReviewerAndJob,
  updateReviewImageUrls,
  type CompanyReviewRecord,
} from '../../lib/database/reviews';
import { uploadReviewImage } from '../../lib/storage/review-images';
import { StarRatingInput } from './StarRatingInput';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';

const MAX_PHOTOS = 3;

interface ServiceReviewPanelProps {
  jobId: string;
  contractorCompanyId: string;
  contractorName: string;
  onSubmitted?: () => void;
}

export function ServiceReviewPanel({
  jobId,
  contractorCompanyId,
  contractorName,
  onSubmitted,
}: ServiceReviewPanelProps): ReactElement {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
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

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const combined = [...photoFiles, ...files].slice(0, MAX_PHOTOS);
    setPhotoFiles(combined);
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoPreviews(combined.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removePhoto = (index: number): void => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
  };

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

      const { data: created, error } = await createCompanyReview(
        supabase,
        contractorCompanyId,
        user.id,
        { rating, comment, jobId },
      );

      if (error || !created) {
        toast.error(error?.message ?? 'Nie udało się zapisać opinii');
        return;
      }

      const imageUrls: string[] = [];
      for (const file of photoFiles) {
        const { url, error: uploadError } = await uploadReviewImage(
          file,
          user.id,
          created.id,
        );
        if (uploadError || !url) {
          toast.error(uploadError?.message ?? 'Błąd przesyłania zdjęcia');
          continue;
        }
        imageUrls.push(url);
      }

      if (imageUrls.length > 0) {
        const { error: updateError } = await updateReviewImageUrls(
          supabase,
          created.id,
          imageUrls,
        );
        if (updateError) {
          toast.error(updateError.message);
        }
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
            Opinia o wykonawcy w konkursie <strong>{contractorName}</strong> została już wystawiona.
          </p>
          <div className="flex items-center gap-1 text-amber-600 font-semibold">
            {'★'.repeat(existing.rating)}
            <span className="text-foreground font-normal ml-2">{existing.rating}/5</span>
          </div>
          {existing.comment && (
            <p className="text-sm whitespace-pre-wrap">{existing.comment}</p>
          )}
          {existing.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {existing.imageUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block h-20 w-20 rounded-md overflow-hidden border"
                >
                  <Image src={url} alt="Zdjęcie z opinii" fill className="object-cover" />
                </a>
              ))}
            </div>
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
        Oceń konkurs wykonawcy <strong>{contractorName}</strong> po zakończeniu realizacji.
      </p>

      <StarRatingInput label="Ocena konkursu" rating={rating} onRatingChange={setRating} />

      <div>
        <Label htmlFor="service-review-comment">Komentarz *</Label>
        <Textarea
          id="service-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Opisz jakość realizacji konkursy…"
          rows={4}
          className="mt-1 resize-none"
        />
      </div>

      <div>
        <Label>Dodaj zdjęcie</Label>
        <p className="text-xs text-muted-foreground mb-2">Maks. {MAX_PHOTOS} zdjęcia (JPG, PNG, WEBP)</p>
        {photoPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {photoPreviews.map((preview, index) => (
              <div key={preview} className="relative h-20 w-20 rounded-md overflow-hidden border">
                <Image src={preview} alt="" fill className="object-cover" />
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  onClick={() => removePhoto(index)}
                  aria-label="Usuń zdjęcie"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {photoFiles.length < MAX_PHOTOS && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted/50">
            <ImagePlus className="h-4 w-4" />
            Wybierz zdjęcie
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              multiple
              onChange={handlePhotosChange}
            />
          </label>
        )}
      </div>

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting || rating === 0 || !comment.trim()}
      >
        {submitting ? 'Zapisywanie…' : 'Wyślij ocenę konkursy'}
      </Button>
    </div>
  );
}
