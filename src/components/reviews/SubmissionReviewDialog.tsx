'use client';

import type { ReactElement } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { SubmissionReviewPanel } from './SubmissionReviewPanel';

interface SubmissionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  managerCompanyId: string;
  managerCompanyName: string;
  submissionTitle?: string;
  onSubmitted?: () => void;
}

export function SubmissionReviewDialog({
  open,
  onOpenChange,
  jobId,
  managerCompanyId,
  managerCompanyName,
  submissionTitle,
  onSubmitted,
}: SubmissionReviewDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Oceń Zgłoszenie</DialogTitle>
          <DialogDescription>
            {submissionTitle
              ? `Oceń zgłoszenie: ${submissionTitle}`
              : `Oceń zgłoszenie zarządcy ${managerCompanyName}.`}
          </DialogDescription>
        </DialogHeader>
        <SubmissionReviewPanel
          jobId={jobId}
          managerCompanyId={managerCompanyId}
          managerCompanyName={managerCompanyName}
          onSubmitted={() => {
            onSubmitted?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
