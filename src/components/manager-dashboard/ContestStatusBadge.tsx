import { Lock, Unlock, CheckCircle2, XCircle } from 'lucide-react';
import type { ReactElement } from 'react';
import { Badge } from '../ui/badge';
import { getContestWorkflowStatusLabel } from '../../lib/tender-workflow-status';

interface ContestStatusBadgeProps {
  status: string;
}

export function ContestStatusBadge({ status }: ContestStatusBadgeProps): ReactElement {
  const label = getContestWorkflowStatusLabel(status);

  if (status === 'active') {
    return (
      <Badge variant="secondary" className="gap-1 font-normal">
        <Lock className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'evaluation') {
    return (
      <Badge variant="default" className="gap-1 font-normal">
        <Unlock className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'awarded') {
    return (
      <Badge variant="outline" className="gap-1 font-normal border-green-600 text-green-700">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'cancelled') {
    return (
      <Badge variant="outline" className="gap-1 font-normal text-destructive border-destructive/40">
        <XCircle className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  return <Badge variant="outline">{label}</Badge>;
}
