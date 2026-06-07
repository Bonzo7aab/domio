'use client';

import { AlertTriangle } from 'lucide-react';
import type { ReactElement } from 'react';
import type { ContestInfo } from '../../types/job';
import type { ContestOfferFormData } from '../../types/contest-offer';
import type { ContestOfferFieldErrors } from '../../lib/database/contest-offers';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../ui/utils';
import {
  ContestOfferFieldError,
  ContestOfferRequiredLabel,
  fieldErrorInputClass,
} from './ContestOfferFieldError';

interface ContestOfferStepScheduleProps {
  form: ContestOfferFormData;
  contestInfo: ContestInfo;
  completionWarning: string | null;
  fieldErrors: ContestOfferFieldErrors;
  onPatch: (patch: Partial<ContestOfferFormData>) => void;
}

export function ContestOfferStepSchedule({
  form,
  contestInfo,
  completionWarning,
  fieldErrors,
  onPatch,
}: ContestOfferStepScheduleProps): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <ContestOfferRequiredLabel htmlFor="contest-offer-proposedCompletionDate">
          Oferowany termin wykonania
        </ContestOfferRequiredLabel>
        <Input
          id="contest-offer-proposedCompletionDate"
          type="date"
          value={form.proposedCompletionDate}
          onChange={(e) => onPatch({ proposedCompletionDate: e.target.value })}
          className={cn(
            'mt-1.5 max-w-xs',
            fieldErrorInputClass(Boolean(fieldErrors.proposedCompletionDate)),
          )}
          aria-invalid={Boolean(fieldErrors.proposedCompletionDate)}
        />
        <ContestOfferFieldError message={fieldErrors.proposedCompletionDate} />
        {completionWarning ? (
          <Alert variant="default" className="mt-3 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900">{completionWarning}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {contestInfo.siteVisitType === 'mandatory' ? (
        <div>
          <label
            id="contest-offer-siteVisitConfirmed"
            className="flex items-start gap-2 cursor-pointer"
          >
            <Checkbox
              checked={form.siteVisitConfirmed}
              onCheckedChange={(v) => onPatch({ siteVisitConfirmed: v === true })}
              aria-invalid={Boolean(fieldErrors.siteVisitConfirmed)}
            />
            <span className="text-sm leading-snug">
              <span className="text-destructive" aria-hidden="true">
                *{' '}
              </span>
              Potwierdzam odbycie wizji lokalnej w terminie wskazanym przez zarządcę.
            </span>
          </label>
          <ContestOfferFieldError message={fieldErrors.siteVisitConfirmed} />
        </div>
      ) : null}
    </div>
  );
}
