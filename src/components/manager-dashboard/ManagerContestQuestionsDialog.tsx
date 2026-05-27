'use client';

import { useEffect, type ReactElement } from 'react';
import { HelpCircle } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { markContestQuestionsSeen } from '../../lib/database/questions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ManagerContestQuestionsPanel } from './ManagerContestQuestionsPanel';

interface ManagerContestQuestionsDialogProps {
  contestId: string | null;
  contestTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnseenCountChange?: (contestId: string, count: number) => void;
  onUnansweredCountChange?: (contestId: string, count: number) => void;
}

export function ManagerContestQuestionsDialog({
  contestId,
  contestTitle,
  open,
  onOpenChange,
  onUnseenCountChange,
  onUnansweredCountChange,
}: ManagerContestQuestionsDialogProps): ReactElement {
  useEffect(() => {
    if (!open || !contestId) return;

    const supabase = createClient();
    void markContestQuestionsSeen(supabase, contestId).then(() => {
      onUnseenCountChange?.(contestId, 0);
    });
  }, [open, contestId, onUnseenCountChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <HelpCircle className="h-5 w-5 text-primary shrink-0" />
            Pytania do konkursu
          </DialogTitle>
          <DialogDescription>{contestTitle}</DialogDescription>
        </DialogHeader>

        {contestId ? (
          <ManagerContestQuestionsPanel
            contestId={contestId}
            onQuestionsChange={(pendingUnanswered) => {
              if (!contestId) return;
              onUnansweredCountChange?.(contestId, pendingUnanswered);
              if (pendingUnanswered === 0) {
                onUnseenCountChange?.(contestId, 0);
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
