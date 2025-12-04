"use client";

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { createContractorReview } from '../lib/database/contractors';
import { createClient } from '../lib/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface ContractorReviewFormProps {
  contractorId: string;
  contractorName: string;
  jobId?: string;
  tenderId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContractorReviewForm({
  contractorId,
  contractorName,
  jobId,
  tenderId,
  onClose,
  onSuccess
}: ContractorReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({
    quality: 0,
    timeliness: 0,
    communication: 0,
    pricing: 0
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryRating = (category: keyof typeof categoryRatings, rating: number) => {
    setCategoryRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error('Proszę wybrać ogólną ocenę');
      return;
    }

    if (!comment.trim()) {
      toast.error('Proszę dodać komentarz');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Musisz być zalogowany aby dodać opinię');
        return;
      }

      const result = await createContractorReview(
        supabase,
        contractorId,
        user.id,
        {
          rating: overallRating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          categories: categoryRatings,
          jobId,
          tenderId
        }
      );

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success('Opinia została dodana pomyślnie');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Wystąpił błąd podczas dodawania opinii');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    hovered, 
    onHover 
  }: { 
    rating: number; 
    onRatingChange: (rating: number) => void;
    hovered: number;
    onHover: (rating: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hovered || rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Oceń wykonawcę: {contractorName}</DialogTitle>
          <DialogDescription>
            Podziel się swoją opinią o współpracy z tym wykonawcą
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Ogólna ocena *
            </Label>
            <StarRating
              rating={overallRating}
              onRatingChange={setOverallRating}
              hovered={hoveredRating}
              onHover={setHoveredRating}
            />
          </div>

          {/* Category Ratings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold mb-3 block">
              Szczegółowe oceny (opcjonalnie)
            </Label>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm mb-2 block">Jakość wykonania</Label>
                <StarRating
                  rating={categoryRatings.quality}
                  onRatingChange={(r) => handleCategoryRating('quality', r)}
                  hovered={0}
                  onHover={() => {}}
                />
              </div>
              
              <div>
                <Label className="text-sm mb-2 block">Terminowość</Label>
                <StarRating
                  rating={categoryRatings.timeliness}
                  onRatingChange={(r) => handleCategoryRating('timeliness', r)}
                  hovered={0}
                  onHover={() => {}}
                />
              </div>
              
              <div>
                <Label className="text-sm mb-2 block">Komunikacja</Label>
                <StarRating
                  rating={categoryRatings.communication}
                  onRatingChange={(r) => handleCategoryRating('communication', r)}
                  hovered={0}
                  onHover={() => {}}
                />
              </div>
              
              <div>
                <Label className="text-sm mb-2 block">Cena</Label>
                <StarRating
                  rating={categoryRatings.pricing}
                  onRatingChange={(r) => handleCategoryRating('pricing', r)}
                  hovered={0}
                  onHover={() => {}}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Tytuł opinii (opcjonalnie)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Profesjonalne wykonanie remontu"
              maxLength={255}
            />
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Komentarz *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Opisz swoje doświadczenie z tym wykonawcą..."
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || overallRating === 0 || !comment.trim()}>
            {isSubmitting ? 'Dodawanie...' : 'Dodaj opinię'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

