'use client';

import { useTransition, type ReactElement } from 'react';
import { toast } from 'sonner';
import { updateJobWorkflowStatusAction } from '../../app/panel-zarzadcy/zgloszenia/actions';
import {
  getJobWorkflowStatusLabel,
  getManagerAllowedJobStatuses,
  normalizeJobStatus,
} from '../../lib/job-workflow-status';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ManagerJobStatusSelectProps {
  jobId: string;
  status: string;
  hasSelectedOffer?: boolean;
  onUpdated?: (status: string) => void;
  className?: string;
}

export function ManagerJobStatusSelect({
  jobId,
  status,
  hasSelectedOffer = false,
  onUpdated,
  className,
}: ManagerJobStatusSelectProps): ReactElement {
  const [isPending, startTransition] = useTransition();
  const normalized = normalizeJobStatus(status);
  const workflowOptions = getManagerAllowedJobStatuses(status, hasSelectedOffer);
  const options =
    status === 'draft'
      ? (['draft', ...workflowOptions] as const)
      : workflowOptions;

  const handleChange = (next: string): void => {
    if (next === normalized) return;
    startTransition(async () => {
      const result = await updateJobWorkflowStatusAction(jobId, next);
      if (!result.success) {
        toast.error(result.error ?? 'Nie udało się zapisać statusu');
        return;
      }
      toast.success('Status zgłoszenia został zaktualizowany');
      onUpdated?.(next);
    });
  };

  return (
    <Select
      value={
        (options as readonly string[]).includes(normalized) ? normalized : undefined
      }
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className={className ?? 'w-[200px] h-8 text-xs'}>
        <SelectValue placeholder={getJobWorkflowStatusLabel(status)} />
      </SelectTrigger>
      <SelectContent>
        {options.map((value) => (
          <SelectItem key={value} value={value}>
            {getJobWorkflowStatusLabel(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
