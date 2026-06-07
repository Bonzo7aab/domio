'use client';

import { useRef, type ReactElement } from 'react';
import { Upload } from 'lucide-react';
import type { ContestInfo } from '../../types/job';
import type { ContestOfferFormData } from '../../types/contest-offer';
import type { ContestOfferFieldErrors } from '../../lib/database/contest-offers';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  formatMonthsLabel,
  warrantyMonthsOptions,
} from '../../lib/contest-offer/warranty-period-options';
import {
  ContestOfferFieldError,
  ContestOfferRequiredLabel,
  fieldErrorInputClass,
} from './ContestOfferFieldError';

interface ContestOfferStepFinancialProps {
  form: ContestOfferFormData;
  contestInfo: ContestInfo;
  grossDisplay: string;
  fieldErrors: ContestOfferFieldErrors;
  onPatch: (patch: Partial<ContestOfferFormData>) => void;
  onStageDeposit: (file: File) => void;
}

export function ContestOfferStepFinancial({
  form,
  contestInfo,
  grossDisplay,
  fieldErrors,
  onPatch,
  onStageDeposit,
}: ContestOfferStepFinancialProps): ReactElement {
  const depositFileRef = useRef<HTMLInputElement>(null);
  const warrantyOptions = warrantyMonthsOptions(contestInfo.warrantyPeriod);
  const guaranteeOptions = warrantyMonthsOptions(contestInfo.guaranteePeriod);
  const showCustomPayment =
    contestInfo.paymentTerms.mode === 'custom' &&
    (contestInfo.paymentTerms.customDays ?? 0) > 14;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ContestOfferRequiredLabel htmlFor="contest-offer-netPrice">
              Cena netto za całość prac (zł)
            </ContestOfferRequiredLabel>
            <Input
              id="contest-offer-netPrice"
              type="number"
              min={0}
              step="0.01"
              value={form.netPrice}
              onChange={(e) => onPatch({ netPrice: e.target.value })}
              className={cn('mt-1.5', fieldErrorInputClass(Boolean(fieldErrors.netPrice)))}
              aria-invalid={Boolean(fieldErrors.netPrice)}
            />
            <ContestOfferFieldError message={fieldErrors.netPrice} />
          </div>
          <div>
            <ContestOfferRequiredLabel>Stawka VAT</ContestOfferRequiredLabel>
            <Select
              value={form.vatRate}
              onValueChange={(v) =>
                onPatch({ vatRate: v as ContestOfferFormData['vatRate'] })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8%</SelectItem>
                <SelectItem value="23">23%</SelectItem>
                <SelectItem value="zw">zw.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 max-w-xs">
          <p className="text-xs text-muted-foreground mb-0.5">Cena brutto (obliczona)</p>
          <p className="text-xl font-semibold">
            {grossDisplay === '—' ? '—' : `${grossDisplay} zł`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <ContestOfferRequiredLabel>Oferowany okres gwarancji</ContestOfferRequiredLabel>
          <Select
            value={form.warrantyMonths}
            onValueChange={(v) => onPatch({ warrantyMonths: v })}
          >
            <SelectTrigger
              id="contest-offer-warrantyMonths"
              className={cn('mt-1.5', fieldErrorInputClass(Boolean(fieldErrors.warrantyMonths)))}
              aria-invalid={Boolean(fieldErrors.warrantyMonths)}
            >
              <SelectValue placeholder="Wybierz" />
            </SelectTrigger>
            <SelectContent>
              {warrantyOptions.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {formatMonthsLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ContestOfferFieldError message={fieldErrors.warrantyMonths} />
        </div>
        <div>
          <ContestOfferRequiredLabel>Oferowany okres rękojmi</ContestOfferRequiredLabel>
          <Select
            value={form.guaranteeMonths}
            onValueChange={(v) => onPatch({ guaranteeMonths: v })}
          >
            <SelectTrigger
              id="contest-offer-guaranteeMonths"
              className={cn('mt-1.5', fieldErrorInputClass(Boolean(fieldErrors.guaranteeMonths)))}
              aria-invalid={Boolean(fieldErrors.guaranteeMonths)}
            >
              <SelectValue placeholder="Wybierz" />
            </SelectTrigger>
            <SelectContent>
              {guaranteeOptions.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {formatMonthsLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ContestOfferFieldError message={fieldErrors.guaranteeMonths} />
        </div>
      </div>

      {contestInfo.depositRequired ? (
        <div>
          <ContestOfferRequiredLabel htmlFor="contest-offer-deposit">
            Potwierdzenie przelewu wadium (PDF lub zdjęcie)
          </ContestOfferRequiredLabel>
          <input
            ref={depositFileRef}
            type="file"
            accept=".pdf,image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onStageDeposit(file);
              e.target.value = '';
            }}
          />
          <Button
            id="contest-offer-deposit"
            type="button"
            variant="outline"
            className={cn(
              'mt-1.5 w-full max-w-md border-dashed gap-2',
              fieldErrors.deposit && 'border-destructive',
            )}
            onClick={() => depositFileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Wgraj potwierdzenie przelewu wadium
          </Button>
          {form.stagedFiles.deposit?.[0] ? (
            <p className="text-xs text-muted-foreground mt-2">
              Wybrano: {form.stagedFiles.deposit[0].name}
            </p>
          ) : null}
          <ContestOfferFieldError message={fieldErrors.deposit} />
        </div>
      ) : null}

      {showCustomPayment ? (
        <div>
          <label
            id="contest-offer-paymentTermsAccepted"
            className="flex items-start gap-2 cursor-pointer"
          >
            <Checkbox
              checked={form.paymentTermsAccepted}
              onCheckedChange={(v) => onPatch({ paymentTermsAccepted: v === true })}
              aria-invalid={Boolean(fieldErrors.paymentTermsAccepted)}
            />
            <span className="text-sm leading-snug">
              <span className="text-destructive" aria-hidden="true">
                *{' '}
              </span>
              Akceptuję wymagany przez zarządcę termin płatności faktury wynoszący{' '}
              {contestInfo.paymentTerms.customDays} dni.
            </span>
          </label>
          <ContestOfferFieldError message={fieldErrors.paymentTermsAccepted} />
        </div>
      ) : null}
    </div>
  );
}
