'use client';

import { AlertTriangle } from 'lucide-react';
import type { ReactElement } from 'react';
import type { ContestInfo } from '../../types/job';
import type { ContestOfferFormData } from '../../types/contest-offer';
import type { ContestOfferFieldErrors } from '../../lib/database/contest-offers';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../ui/utils';
import { ContestOfferFieldError, fieldErrorInputClass } from './ContestOfferFieldError';

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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Termin składania ofert</CardTitle>
          <Badge variant="secondary">Informacja</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Oferty przyjmowane są do:{' '}
            <span className="font-medium">
              {new Date(contestInfo.submissionDeadline).toLocaleString('pl-PL', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Twój harmonogram</CardTitle>
          <Badge>Wymagane</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="proposedCompletionDate">Oferowany termin wykonania</Label>
            <Input
              id="proposedCompletionDate"
              type="date"
              value={form.proposedCompletionDate}
              onChange={(e) => onPatch({ proposedCompletionDate: e.target.value })}
              className={cn('mt-1.5 max-w-xs', fieldErrorInputClass(Boolean(fieldErrors.proposedCompletionDate)))}
              aria-invalid={Boolean(fieldErrors.proposedCompletionDate)}
            />
            <ContestOfferFieldError message={fieldErrors.proposedCompletionDate} />
          </div>
          {completionWarning ? (
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <AlertDescription className="text-amber-900">{completionWarning}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Wizja lokalna</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Wymaganie</span>
            <p className="font-medium text-sm">{contestInfo.siteVisitTypeLabel}</p>
          </div>
          {contestInfo.siteVisitNotes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {contestInfo.siteVisitNotes}
            </p>
          ) : null}
          {contestInfo.siteVisitType === 'mandatory' ? (
            <div>
              <label
                className={cn(
                  'flex items-start gap-2 cursor-pointer rounded-md border p-3 bg-muted/30',
                  fieldErrors.siteVisitConfirmed && 'border-destructive bg-destructive/5',
                )}
              >
                <Checkbox
                  checked={form.siteVisitConfirmed}
                  onCheckedChange={(v) => onPatch({ siteVisitConfirmed: v === true })}
                  aria-invalid={Boolean(fieldErrors.siteVisitConfirmed)}
                />
                <span className="text-sm leading-snug">
                  Potwierdzam odbycie wizji lokalnej w terminie wskazanym przez zarządcę.
                </span>
              </label>
              <ContestOfferFieldError message={fieldErrors.siteVisitConfirmed} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
