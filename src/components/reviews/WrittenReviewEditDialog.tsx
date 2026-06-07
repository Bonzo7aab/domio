'use client';

import type { ReactElement } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { WrittenReviewEditPanel } from './WrittenReviewEditPanel';

interface WrittenReviewEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  counterpartyName: string;
  initialRating: number;
  initialComment: string;
  onSaved?: (updated: { rating: number; comment: string }) => void;
}

export function WrittenReviewEditDialog({
  open,
  onOpenChange,
  reviewId,
  counterpartyName,
  initialRating,
  initialComment,
  onSaved,
}: WrittenReviewEditDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj ocenę</DialogTitle>
        </DialogHeader>
        <WrittenReviewEditPanel
          key={reviewId}
          reviewId={reviewId}
          counterpartyName={counterpartyName}
          initialRating={initialRating}
          initialComment={initialComment}
          onSaved={(updated) => {
            onSaved?.(updated);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
