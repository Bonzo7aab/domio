'use client';

import { useTransition, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  updateJobWorkflowStatusAction,
  updateTenderWorkflowStatusAction,
} from '../../app/manager-dashboard/zgloszenia/actions';
import {
  formatWorkflowTransitionLabel,
  getJobWorkflowAdvanceAction,
  getJobWorkflowStatusLabel,
  normalizeJobStatus,
} from '../../lib/job-workflow-status';
import {
  getTenderWorkflowAdvanceAction,
  getTenderWorkflowStatusLabel,
} from '../../lib/tender-workflow-status';
import type { ManagerSubmission } from '../../lib/database/manager-submissions';
import { Button } from '../ui/button';

interface ManagerWorkflowAdvanceButtonProps {
  row: ManagerSubmission;
  onStatusUpdated?: (status: string) => void;
}

function TransitionLabel({
  currentLabel,
  nextLabel,
}: {
  currentLabel: string;
  nextLabel: string;
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="font-normal opacity-90">{currentLabel}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      <span className="font-medium">{nextLabel}</span>
    </span>
  );
}

export function ManagerWorkflowAdvanceButton({
  row,
  onStatusUpdated,
}: ManagerWorkflowAdvanceButtonProps): ReactElement | null {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (row.kind === 'job') {
    const normalized = normalizeJobStatus(row.status);
    const advance = getJobWorkflowAdvanceAction(row.status, row.hasSelectedOffer);

    if (normalized === 'selecting_offer' && !row.hasSelectedOffer) {
      if (row.offersCount === 0) {
        return null;
      }
      const currentLabel = getJobWorkflowStatusLabel(row.status);
      return (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            router.push(
              `/manager-dashboard/zgloszenia/porownaj/${row.id}?typ=zgłoszenie`,
            )
          }
        >
          <TransitionLabel currentLabel={currentLabel} nextLabel="Porównaj oferty" />
        </Button>
      );
    }

    if (!advance) {
      return null;
    }

    const handleAdvance = (): void => {
      startTransition(async () => {
        const result = await updateJobWorkflowStatusAction(row.id, advance.nextStatus);
        if (!result.success) {
          toast.error(result.error ?? 'Nie udało się zaktualizować statusu');
          return;
        }
        toast.success(formatWorkflowTransitionLabel(advance.currentLabel, advance.nextLabel));
        onStatusUpdated?.(advance.nextStatus);
      });
    };

    return (
      <Button size="sm" variant="secondary" onClick={handleAdvance} disabled={isPending}>
        {isPending ? (
          'Zapisywanie…'
        ) : (
          <TransitionLabel currentLabel={advance.currentLabel} nextLabel={advance.nextLabel} />
        )}
      </Button>
    );
  }

  const advance = getTenderWorkflowAdvanceAction(row.status, row.hasSelectedOffer);

  if (row.status === 'evaluation' && !row.hasSelectedOffer) {
    if (row.offersCount === 0) {
      return null;
    }
    const currentLabel = getTenderWorkflowStatusLabel(row.status);
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          router.push(`/manager-dashboard/zgloszenia/porownaj/${row.id}?typ=przetarg`)
        }
      >
        <TransitionLabel currentLabel={currentLabel} nextLabel="Porównaj oferty" />
      </Button>
    );
  }

  if (!advance) {
    return null;
  }

  const handleTenderAdvance = (): void => {
    startTransition(async () => {
      const result = await updateTenderWorkflowStatusAction(row.id, advance.nextStatus);
      if (!result.success) {
        toast.error(result.error ?? 'Nie udało się zaktualizować statusu');
        return;
      }
      toast.success(formatWorkflowTransitionLabel(advance.currentLabel, advance.nextLabel));
      onStatusUpdated?.(advance.nextStatus);
    });
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleTenderAdvance} disabled={isPending}>
      {isPending ? (
        'Zapisywanie…'
      ) : (
        <TransitionLabel currentLabel={advance.currentLabel} nextLabel={advance.nextLabel} />
      )}
    </Button>
  );
}
