'use client';

import { Check } from 'lucide-react';
import type { ReactElement } from 'react';
import { cn } from '../ui/utils';

interface ContestOfferWizardStepperProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function ContestOfferWizardStepper({
  currentStep,
  totalSteps,
  labels,
}: ContestOfferWizardStepperProps): ReactElement {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <ol className="flex items-start gap-1 sm:gap-2">
        {labels.map((label, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <li
              key={label}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 text-center',
                index < labels.length - 1 && 'relative',
              )}
            >
              {index < labels.length - 1 ? (
                <span
                  className={cn(
                    'absolute left-[calc(50%+14px)] right-[calc(-50%+14px)] top-3.5 hidden h-0.5 sm:block',
                    isComplete ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && !isComplete && 'border-primary bg-background text-primary',
                  !isComplete && !isCurrent && 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" aria-hidden /> : stepNumber}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] leading-tight sm:block sm:text-xs',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
        <span>
          Krok {currentStep} z {totalSteps}: {labels[currentStep - 1]}
        </span>
        <span>{progressPercent}%</span>
      </div>
    </div>
  );
}
