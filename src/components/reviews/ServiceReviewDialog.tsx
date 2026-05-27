'use client';

import type { ReactElement } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ServiceReviewPanel } from './ServiceReviewPanel';

interface ServiceReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  contractorCompanyId: string;
  contractorName: string;
  onSubmitted?: () => void;
}

export function ServiceReviewDialog({
  open,
  onOpenChange,
  jobId,
  contractorCompanyId,
  contractorName,
  onSubmitted,
}: ServiceReviewDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Oceń Zlecenie: {contractorName}</DialogTitle>
          <DialogDescription>
            Oceń realizację zlecenia przez wykonawcę — gwiazdki, komentarz i opcjonalne zdjęcia.
          </DialogDescription>
        </DialogHeader>
        <ServiceReviewPanel
          jobId={jobId}
          contractorCompanyId={contractorCompanyId}
          contractorName={contractorName}
          onSubmitted={() => {
            onSubmitted?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
