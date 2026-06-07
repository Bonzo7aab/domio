'use client';

import { useRef, type ReactElement } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import type { ContestInfo } from '../../types/job';
import type {
  ContestOfferFormData,
  FormalRequirementKey,
  ResolvedContractorDocument,
} from '../../types/contest-offer';
import type { ContestOfferFieldErrors } from '../../lib/database/contest-offers';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { ContestOfferFormalDocBlock } from './ContestOfferFormalDocBlock';
import {
  ContestOfferFieldError,
  ContestOfferOptionalLabel,
  ContestOfferRequiredLabel,
  fieldErrorInputClass,
} from './ContestOfferFieldError';

interface ContestOfferStepFormalProps {
  form: ContestOfferFormData;
  contestInfo: ContestInfo;
  resolvedDocs: ResolvedContractorDocument[];
  fieldErrors: ContestOfferFieldErrors;
  onPatch: (patch: Partial<ContestOfferFormData>) => void;
  onUseProfile: (doc: ResolvedContractorDocument) => void;
  onUploadFormal: (key: FormalRequirementKey, file: File) => void;
  onRemoveFormal: (key: FormalRequirementKey) => void;
  onStageOther: (file: File) => void;
  onRemoveExtra: (id: string) => void;
}

export function ContestOfferStepFormal({
  form,
  contestInfo,
  resolvedDocs,
  fieldErrors,
  onPatch,
  onUseProfile,
  onUploadFormal,
  onRemoveFormal,
  onStageOther,
  onRemoveExtra,
}: ContestOfferStepFormalProps): ReactElement {
  const otherFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {resolvedDocs
        .filter((doc) => doc.requirementKey !== 'references')
        .map((doc) => (
          <ContestOfferFormalDocBlock
            key={doc.requirementKey}
            doc={doc}
            attached={form.formalAttachments[doc.requirementKey]}
            stagedName={form.stagedFiles[doc.requirementKey]?.[0]?.name}
            fieldError={fieldErrors.formal?.[doc.requirementKey]}
            onUseProfile={() => onUseProfile(doc)}
            onUpload={(file) => onUploadFormal(doc.requirementKey, file)}
            onRemove={() => onRemoveFormal(doc.requirementKey)}
          />
        ))}

      {contestInfo.formalRequirements.references ? (
        <div>
          <ContestOfferRequiredLabel htmlFor="contest-offer-referencesText">
            Referencje — wykaz zrealizowanych prac
          </ContestOfferRequiredLabel>
          <Textarea
            id="contest-offer-referencesText"
            rows={5}
            value={form.referencesText}
            onChange={(e) => onPatch({ referencesText: e.target.value })}
            placeholder="Opisz zrealizowane projekty, zakres prac, lokalizację…"
            className={cn('mt-1.5', fieldErrorInputClass(Boolean(fieldErrors.referencesText)))}
            aria-invalid={Boolean(fieldErrors.referencesText)}
          />
          <ContestOfferFieldError message={fieldErrors.referencesText} />
        </div>
      ) : null}

      <div>
        <ContestOfferOptionalLabel>Inne załączniki</ContestOfferOptionalLabel>
        <div className="mt-3 space-y-3">
          {form.extraAttachments.filter((a) => a.requirementKey !== 'deposit').length > 0 ? (
            <ul className="space-y-2">
              {form.extraAttachments
                .filter((a) => a.requirementKey !== 'deposit')
                .map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{att.name}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      aria-label={`Usuń ${att.name}`}
                      onClick={() => onRemoveExtra(att.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
            </ul>
          ) : null}
          {form.stagedFiles.other?.[0] ? (
            <p className="text-xs text-muted-foreground">
              Do wgrania przy zapisie: {form.stagedFiles.other[0].name}
            </p>
          ) : null}
          <input
            ref={otherFileRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onStageOther(file);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed gap-2"
            onClick={() => otherFileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Dodaj załącznik
          </Button>
        </div>
      </div>
    </div>
  );
}
