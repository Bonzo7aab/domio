'use client';

import type { ReactElement } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  CooperationReviewPanel,
  type CooperationReviewVariant,
} from './CooperationReviewPanel';

export type { CooperationReviewVariant };

interface CooperationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: CooperationReviewVariant;
  tenderId: string;
  counterpartyCompanyId: string;
  counterpartyCompanyName: string;
  /** When true, dialog title is "Ocena współpracy" (edit existing review). */
  isEditing?: boolean;
  onSubmitted?: (updated: { rating: number; comment: string }) => void;
}

export function CooperationReviewDialog({
  open,
  onOpenChange,
  variant,
  tenderId,
  counterpartyCompanyId,
  counterpartyCompanyName,
  isEditing = false,
  onSubmitted,
}: CooperationReviewDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ocena współpracy' : 'Oceń współpracę'}</DialogTitle>
        </DialogHeader>
        <CooperationReviewPanel
          variant={variant}
          tenderId={tenderId}
          counterpartyCompanyId={counterpartyCompanyId}
          counterpartyCompanyName={counterpartyCompanyName}
          onSubmitted={(updated) => {
            onSubmitted?.(updated);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
