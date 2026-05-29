'use client';

import { useTransition, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3 } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface ManagerWorkflowAdvanceButtonProps {
  row: ManagerSubmission;
  onStatusUpdated?: (status: string) => void;
  compact?: boolean;
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

function compactTooltipLabel(currentLabel: string, nextLabel: string): string {
  return `${currentLabel} → ${nextLabel}`;
}

function CompactWorkflowIconButton({
  label,
  icon,
  onClick,
  disabled,
  variant = 'secondary',
}: {
  label: string;
  icon: ReactElement;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
}): ReactElement {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant={variant}
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={disabled}
              onClick={onClick}
              aria-label={label}
            >
              {icon}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ManagerWorkflowAdvanceButton({
  row,
  onStatusUpdated,
  compact = false,
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
      const compareLabel = compactTooltipLabel(currentLabel, 'Porównaj oferty');
      if (compact) {
        return (
          <CompactWorkflowIconButton
            label={compareLabel}
            icon={<BarChart3 className="h-4 w-4" />}
            disabled={isPending}
            variant="default"
            onClick={() =>
              router.push(
                `/manager-dashboard/zgloszenia/porownaj/${row.id}?typ=zgłoszenie`,
              )
            }
          />
        );
      }
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

    if (compact) {
      return (
        <CompactWorkflowIconButton
          label={
            isPending
              ? 'Zapisywanie…'
              : compactTooltipLabel(advance.currentLabel, advance.nextLabel)
          }
          icon={<ArrowRight className="h-4 w-4" />}
          disabled={isPending}
          onClick={handleAdvance}
        />
      );
    }

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
    const compareLabel = compactTooltipLabel(currentLabel, 'Porównaj oferty');
    if (compact) {
      return (
        <CompactWorkflowIconButton
          label={compareLabel}
          icon={<BarChart3 className="h-4 w-4" />}
          disabled={isPending}
          variant="default"
          onClick={() =>
            router.push(`/manager-dashboard/zgloszenia/porownaj/${row.id}?typ=przetarg`)
          }
        />
      );
    }
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

  if (compact) {
    return (
      <CompactWorkflowIconButton
        label={
          isPending
            ? 'Zapisywanie…'
            : compactTooltipLabel(advance.currentLabel, advance.nextLabel)
        }
        icon={<ArrowRight className="h-4 w-4" />}
        disabled={isPending}
        onClick={handleTenderAdvance}
      />
    );
  }

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
