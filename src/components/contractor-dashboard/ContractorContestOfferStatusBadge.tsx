import { Lock, Unlock, CheckCircle2, XCircle, Ban } from 'lucide-react';
import type { ReactElement } from 'react';
import { Badge } from '../ui/badge';
import {
  getContractorContestOfferStatusLabel,
  getContractorContestOfferStatusVariant,
  type ContractorContestOfferStatus,
} from '../../lib/contest-offer/contractor-contest-offer-status';
import { cn } from '../ui/utils';

interface ContractorContestOfferStatusBadgeProps {
  status: ContractorContestOfferStatus;
}

export function ContractorContestOfferStatusBadge({
  status,
}: ContractorContestOfferStatusBadgeProps): ReactElement {
  const label = getContractorContestOfferStatusLabel(status);
  const variant = getContractorContestOfferStatusVariant(status);

  const className = cn(
    'gap-1 font-normal',
    variant === 'success' && 'border-green-600 text-green-700',
    variant === 'destructive' && status === 'withdrawn' && 'text-muted-foreground border-muted',
  );

  if (status === 'submitted') {
    return (
      <Badge variant="secondary" className={className}>
        <Lock className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'in_evaluation') {
    return (
      <Badge variant="default" className={className}>
        <Unlock className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'selected') {
    return (
      <Badge variant="outline" className={className}>
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'withdrawn') {
    return (
      <Badge variant="outline" className={className}>
        <Ban className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (status === 'not_selected') {
    return (
      <Badge variant="outline" className={cn(className, 'text-destructive border-destructive/40')}>
        <XCircle className="h-3 w-3" aria-hidden />
        {label}
      </Badge>
    );
  }

  return <Badge variant="outline">{label}</Badge>;
}
