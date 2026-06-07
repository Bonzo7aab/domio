'use client';

import Link from 'next/link';
import { useRef, type ReactElement } from 'react';
import { CheckCircle2, ExternalLink, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import type {
  ContestOfferAttachmentRef,
  ResolvedContractorDocument,
} from '../../types/contest-offer';
import { CONTRACTOR_VERIFICATION_DOCUMENTS_PATH } from '../../lib/verification/documents-route';
import { ContestOfferFieldError } from './ContestOfferFieldError';

export type FormalDocStatus = 'missing' | 'from_profile' | 'pending_upload' | 'ready';

export function getFormalDocStatus(
  attached: ContestOfferAttachmentRef | undefined,
  stagedName: string | undefined,
): FormalDocStatus {
  if (!attached && !stagedName) return 'missing';
  if (stagedName) return 'pending_upload';
  if (attached?.source === 'profile') return 'from_profile';
  return 'ready';
}

const STATUS_LABELS: Record<FormalDocStatus, string> = {
  missing: 'Brakuje',
  from_profile: 'Z profilu',
  pending_upload: 'Do wgrania',
  ready: 'Gotowe',
};

const STATUS_VARIANT: Record<
  FormalDocStatus,
  'destructive' | 'secondary' | 'outline' | 'default'
> = {
  missing: 'destructive',
  from_profile: 'secondary',
  pending_upload: 'outline',
  ready: 'default',
};

interface ContestOfferFormalDocBlockProps {
  doc: ResolvedContractorDocument;
  attached?: ContestOfferAttachmentRef;
  stagedName?: string;
  fieldError?: string;
  onUseProfile: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function ContestOfferFormalDocBlock({
  doc,
  attached,
  stagedName,
  fieldError,
  onUseProfile,
  onUpload,
  onRemove,
}: ContestOfferFormalDocBlockProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = stagedName ?? attached?.name;
  const isAttached = Boolean(displayName);
  const status = getFormalDocStatus(attached, stagedName);
  const fromProfile = attached?.source === 'profile' && !stagedName;
  const badgeVariant = fieldError ? 'destructive' : STATUS_VARIANT[status];

  const handleFileChange = (file: File | undefined): void => {
    if (file) onUpload(file);
  };

  return (
    <div
      data-contest-offer-formal={doc.requirementKey}
      className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="font-semibold">
          {doc.label}
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        </div>
        <Badge variant={badgeVariant}>{STATUS_LABELS[status]}</Badge>
      </div>

      {isAttached ? (
        fromProfile ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="font-medium truncate">{displayName}</span>
              {attached?.url ? (
                <Link
                  href={attached.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary shrink-0 hover:underline inline-flex items-center gap-1"
                >
                  Podgląd
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <HiddenFileInput inputRef={fileInputRef} onFile={handleFileChange} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Zamień plik
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                Usuń
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 text-sm min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="font-medium truncate">{displayName}</span>
                </div>
                {status === 'pending_upload' ? (
                  <p className="text-muted-foreground pl-6">
                    Plik zostanie dołączony po zapisaniu szkicu lub wysłaniu oferty.
                  </p>
                ) : (
                  <p className="text-muted-foreground pl-6">Dokument dołączony do oferty.</p>
                )}
                {attached?.url && !stagedName ? (
                  <Link
                    href={attached.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs pl-6 hover:underline inline-flex items-center gap-1"
                  >
                    Podgląd pliku
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                Usuń
              </Button>
            </div>
            <FileUploadButton
              inputRef={fileInputRef}
              label="Zmień plik"
              buttonLabel="Wybierz plik"
              onFile={handleFileChange}
            />
          </div>
        )
      ) : (
        <div className="space-y-3">
          {doc.missing ? (
            <p className="text-sm text-muted-foreground">
              Brak tego dokumentu w profilu.{' '}
              <Link
                href={CONTRACTOR_VERIFICATION_DOCUMENTS_PATH}
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                Uzupełnij w profilu
                <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          ) : (
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">W profilu masz:</p>
              <div className="flex flex-wrap items-center gap-2">
                {doc.signedUrl ? (
                  <Link
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {doc.fileName}
                  </Link>
                ) : (
                  <span>{doc.fileName}</span>
                )}
                {doc.hint ? <Badge variant="secondary">{doc.hint}</Badge> : null}
                <Button type="button" size="sm" variant="outline" onClick={onUseProfile}>
                  Użyj z profilu
                </Button>
              </div>
            </div>
          )}
          <FileUploadButton
            inputRef={fileInputRef}
            label="Wgraj dokument do oferty"
            buttonLabel="Wybierz plik"
            onFile={handleFileChange}
          />
        </div>
      )}
      <ContestOfferFieldError message={fieldError} />
    </div>
  );
}

function HiddenFileInput({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void;
}): ReactElement {
  return (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,.doc,.docx,image/*"
      className="sr-only"
      onChange={(e) => {
        onFile(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );
}

function FileUploadButton({
  inputRef,
  label,
  buttonLabel,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  buttonLabel: string;
  onFile: (file: File | undefined) => void;
}): ReactElement {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <HiddenFileInput inputRef={inputRef} onFile={onFile} />
      <Button
        type="button"
        variant="outline"
        className="mt-1.5 w-full border-dashed gap-2"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4 shrink-0" />
        {buttonLabel}
      </Button>
    </div>
  );
}
