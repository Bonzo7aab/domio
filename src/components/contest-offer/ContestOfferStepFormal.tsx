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
import { countFormalRequirementsProgress } from '../../lib/database/contest-offers';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import { ContestOfferFormalDocBlock } from './ContestOfferFormalDocBlock';
import { ContestOfferFieldError, fieldErrorInputClass } from './ContestOfferFieldError';

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
  const { completed, total } = countFormalRequirementsProgress(form, contestInfo);
  const allComplete = total > 0 && completed === total;

  return (
    <div className="space-y-4">
      {total > 0 ? (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 flex flex-wrap items-center justify-between gap-2',
            allComplete
              ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20'
              : 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20',
          )}
        >
          <p className="text-sm font-medium">
            Dokumenty formalne: {completed} z {total} gotowych
          </p>
          <Badge variant={allComplete ? 'default' : 'secondary'}>
            {allComplete ? 'Komplet' : 'Do uzupełnienia'}
          </Badge>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Wymagane dokumenty uzupełniają się automatycznie z profilu, jeśli są dostępne. Możesz je
        usunąć, zastąpić lub wgrać brakujące pliki.
      </p>

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
        <Card
          className={cn(fieldErrors.referencesText && 'border-destructive bg-destructive/5')}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Referencje</CardTitle>
            <Badge>Wymagane</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {contestInfo.formalRequirementLines
              .filter((l) => l.toLowerCase().includes('referenc'))
              .map((line) => (
                <p key={line} className="text-xs text-muted-foreground">
                  {line}
                </p>
              ))}
            <Label htmlFor="contest-offer-referencesText" className="sr-only">
              Wykaz zrealizowanych prac
            </Label>
            <Textarea
              id="contest-offer-referencesText"
              rows={5}
              value={form.referencesText}
              onChange={(e) => onPatch({ referencesText: e.target.value })}
              placeholder="Opisz zrealizowane projekty, zakres prac, lokalizację…"
              className={fieldErrorInputClass(Boolean(fieldErrors.referencesText))}
              aria-invalid={Boolean(fieldErrors.referencesText)}
            />
            <ContestOfferFieldError message={fieldErrors.referencesText} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inne załączniki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Opcjonalne dodatkowe pliki do oferty.</p>
          {form.extraAttachments.length > 0 ? (
            <ul className="space-y-2">
              {form.extraAttachments.map((att) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
