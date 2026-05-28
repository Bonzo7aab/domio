'use client';

import type { ReactElement } from 'react';
import { SelectedOfferPanel } from './SelectedOfferPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface ManagerContestWinnerDialogProps {
  contestId: string | null;
  contestTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManagerContestWinnerDialog({
  contestId,
  contestTitle,
  open,
  onOpenChange,
}: ManagerContestWinnerDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wygrana oferta</DialogTitle>
          <DialogDescription>
            {contestTitle ? `Konkurs: ${contestTitle}` : 'Szczegóły wybranej oferty wykonawcy'}
          </DialogDescription>
        </DialogHeader>

        {contestId ? (
          <SelectedOfferPanel submissionId={contestId} kind="tender" />
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">Brak danych oferty.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
