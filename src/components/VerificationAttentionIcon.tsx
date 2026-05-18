import { BadgeAlert } from 'lucide-react';
import { cn } from './ui/utils';

interface VerificationAttentionIconProps {
  className?: string;
}

/** Lucide badge-alert — unverified / verification required indicator */
export function VerificationAttentionIcon({ className }: VerificationAttentionIconProps) {
  return (
    <BadgeAlert
      className={cn('text-amber-600', className)}
      strokeWidth={2}
      aria-hidden
    />
  );
}
