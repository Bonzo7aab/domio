'use client';

import { useTransition, type ReactElement } from 'react';
import { toast } from 'sonner';
import { updateTenderWorkflowStatusAction } from '../../app/manager-dashboard/zgloszenia/actions';
import {
  getManagerAllowedTenderStatuses,
  getTenderWorkflowStatusLabel,
} from '../../lib/tender-workflow-status';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ManagerTenderStatusSelectProps {
  tenderId: string;
  status: string;
  hasSelectedOffer?: boolean;
  onUpdated?: (status: string) => void;
  className?: string;
}

export function ManagerTenderStatusSelect({
  tenderId,
  status,
  hasSelectedOffer = false,
  onUpdated,
  className,
}: ManagerTenderStatusSelectProps): ReactElement {
  const [isPending, startTransition] = useTransition();
  const options = getManagerAllowedTenderStatuses(status, hasSelectedOffer);
  const displayOptions =
    status === 'draft' ? (['draft', ...options] as const) : options;

  const handleChange = (next: string): void => {
    if (next === status) return;
    startTransition(async () => {
      const result = await updateTenderWorkflowStatusAction(tenderId, next);
      if (!result.success) {
        toast.error(result.error ?? 'Nie udało się zapisać statusu');
        return;
      }
      toast.success('Status przetargu został zaktualizowany');
      onUpdated?.(next);
    });
  };

  const selectValue = (displayOptions as readonly string[]).includes(status)
    ? status
    : undefined;

  return (
    <Select value={selectValue} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className={className ?? 'w-[200px] h-8 text-xs'}>
        <SelectValue placeholder={getTenderWorkflowStatusLabel(status)} />
      </SelectTrigger>
      <SelectContent>
        {displayOptions.map((value) => (
          <SelectItem key={value} value={value}>
            {getTenderWorkflowStatusLabel(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
