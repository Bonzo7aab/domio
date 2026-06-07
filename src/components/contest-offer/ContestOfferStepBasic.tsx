'use client';

import { useRef, type ReactElement } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import type { ContestOfferFormData } from '../../types/contest-offer';
import { Button } from '../ui/button';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '../ui/dropzone';
import { ContestOfferRequiredLabel } from './ContestOfferFieldError';

interface ContestOfferStepBasicProps {
  form: ContestOfferFormData;
  onStageFile: (file: File) => void;
  onRemoveExtra: (id: string) => void;
}

export function ContestOfferStepBasic({
  form,
  onStageFile,
  onRemoveExtra,
}: ContestOfferStepBasicProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const offerDocs = form.extraAttachments.filter((a) => a.requirementKey !== 'deposit');
  const stagedName = form.stagedFiles.other?.[0]?.name;

  return (
    <div className="space-y-4">
      <div>
        <ContestOfferRequiredLabel>Dokumentacja ofertowa</ContestOfferRequiredLabel>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Dodaj pliki oferty — kosztorys, opis techniczny, załączniki wymagane w konkursie.
        </p>
        <Dropzone
          accept={{
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
          }}
          maxFiles={10}
          onDrop={(files) => {
            const file = files[0];
            if (file) onStageFile(file);
          }}
          className="min-h-[180px] border-dashed"
        >
          <DropzoneEmptyState>
            <p className="font-medium text-sm">Przeciągnij pliki tutaj lub kliknij, aby wybrać</p>
            <p className="text-muted-foreground text-xs mt-1">PDF, DOC, DOCX lub obrazy</p>
          </DropzoneEmptyState>
          <DropzoneContent />
        </Dropzone>
      </div>

      {(offerDocs.length > 0 || stagedName) && (
        <ul className="space-y-2">
          {offerDocs.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          {stagedName ? (
            <li className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="truncate">Do wgrania przy zapisie: {stagedName}</span>
            </li>
          ) : null}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onStageFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
