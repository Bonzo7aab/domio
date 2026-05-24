import { Badge } from '../ui/badge';
import type { VerificationState } from '../../lib/verification/types';
import {
  verificationStatusBadgeClass,
  verificationStatusLabel,
} from '../../lib/verification/status';

interface VerificationStatusBadgeProps {
  state: VerificationState;
  className?: string;
}

export function VerificationStatusBadge({ state, className }: VerificationStatusBadgeProps) {
  return (
    <Badge className={`${verificationStatusBadgeClass(state)} ${className ?? ''}`}>
      {verificationStatusLabel(state)}
    </Badge>
  );
}
