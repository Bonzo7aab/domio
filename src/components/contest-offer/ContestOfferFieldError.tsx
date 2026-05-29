'use client';

import type { ReactElement } from 'react';
import { cn } from '../ui/utils';

interface ContestOfferFieldErrorProps {
  message?: string;
  className?: string;
}

export function ContestOfferFieldError({
  message,
  className,
}: ContestOfferFieldErrorProps): ReactElement | null {
  if (!message) return null;

  return (
    <p role="alert" className={cn('text-sm text-destructive mt-1.5', className)}>
      {message}
    </p>
  );
}

export function fieldErrorInputClass(hasError: boolean): string {
  return hasError ? 'border-destructive focus-visible:ring-destructive/30' : '';
}
