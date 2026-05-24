'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileUp, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  getVerificationDocumentSignedUrl,
  removeVerificationDocumentsFromBucket,
  uploadTaxCertificateScan,
  uploadZusCertificateScan,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface OfficialCertificateRowProps {
  label: string;
  path: string | null;
  issuedAt: string;
  onPathChange: (path: string | null) => void;
  onIssuedAtChange: (value: string) => void;
  onUpload: (file: File) => Promise<{ path: string }>;
  inputId: string;
  dateId: string;
}

function OfficialCertificateRow({
  label,
  path,
  issuedAt,
  onPathChange,
  onIssuedAtChange,
  onUpload,
  inputId,
  dateId,
}: OfficialCertificateRowProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!path) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void getVerificationDocumentSignedUrl(path).then(url => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const result = await onUpload(file);
      onPathChange(result.path);
      toast.success(`${label}: plik zapisany`);
    } catch (error) {
      console.error(error);
      toast.error(`Nie udało się wgrać pliku (${label})`);
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!path) return;
    try {
      setIsSaving(true);
      await removeVerificationDocumentsFromBucket([path]);
      onPathChange(null);
      toast.success(`${label}: plik usunięty`);
    } catch (error) {
      console.error(error);
      toast.error(`Nie udało się usunąć pliku (${label})`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <OfficialCertificateDateField
        dateId={dateId}
        issuedAt={issuedAt}
        onIssuedAtChange={onIssuedAtChange}
      />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
          {path ? path.split('/').pop() : 'Brak pliku PDF'}
        </p>
        {path ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={isSaving}
            onClick={() => void handleRemove()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        <Button variant="outline" size="sm" disabled={isSaving} asChild>
          <label htmlFor={inputId} className="cursor-pointer">
            <FileUp className="h-4 w-4 mr-2" />
            {path ? 'Zamień' : 'Dodaj PDF'}
          </label>
        </Button>
        {path && previewUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Otwórz
            </a>
          </Button>
        ) : null}
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function OfficialCertificateDateField({
  dateId,
  issuedAt,
  onIssuedAtChange,
}: {
  dateId: string;
  issuedAt: string;
  onIssuedAtChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1 flex-1 sm:max-w-xs">
      <Label htmlFor={dateId} className="text-xs">
        Data wystawienia
      </Label>
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={dateId}
          type="date"
          className="pl-9"
          value={issuedAt}
          onChange={e => onIssuedAtChange(e.target.value)}
        />
      </div>
    </div>
  );
}

interface ContractorOfficialCertificatesSettingsProps {
  userId: string;
}

export function ContractorOfficialCertificatesSettings({ userId }: ContractorOfficialCertificatesSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [zusPath, setZusPath] = React.useState<string | null>(null);
  const [zusDate, setZusDate] = React.useState('');
  const [taxPath, setTaxPath] = React.useState<string | null>(null);
  const [taxDate, setTaxDate] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        setZusPath(settings.zusCertificatePath);
        setZusDate(settings.zusCertificateIssuedAt ?? '');
        setTaxPath(settings.taxCertificatePath);
        setTaxDate(settings.taxCertificateIssuedAt ?? '');
      } catch (error) {
        console.error(error);
        toast.error('Nie udało się załadować zaświadczeń');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  const persist = async (patch: Parameters<typeof upsertContractorAccountSettings>[1]) => {
    await upsertContractorAccountSettings(userId, patch);
    router.refresh();
  };

  const handleSaveDates = async () => {
    try {
      setIsSaving(true);
      await persist({
        zusCertificateIssuedAt: zusDate || null,
        taxCertificateIssuedAt: taxDate || null,
      });
      toast.success('Daty zaświadczeń zapisane');
    } catch (error) {
      console.error(error);
      toast.error('Nie udało się zapisać dat');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Ładowanie zaświadczeń…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Zarządcy wymagają dokumentów nie starszych niż 3 miesiące.
      </p>
      <OfficialCertificateRow
        label="Zaświadczenie ZUS (niezaleganie)"
        path={zusPath}
        issuedAt={zusDate}
        inputId="zus-cert-file"
        dateId="zus-cert-date"
        onPathChange={path => {
          setZusPath(path);
          void persist({ zusCertificatePath: path });
        }}
        onIssuedAtChange={setZusDate}
        onUpload={file => uploadZusCertificateScan(userId, file)}
      />
      <OfficialCertificateRow
        label="Zaświadczenie Skarbowe (US)"
        path={taxPath}
        issuedAt={taxDate}
        inputId="tax-cert-file"
        dateId="tax-cert-date"
        onPathChange={path => {
          setTaxPath(path);
          void persist({ taxCertificatePath: path });
        }}
        onIssuedAtChange={setTaxDate}
        onUpload={file => uploadTaxCertificateScan(userId, file)}
      />
      <Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={handleSaveDates}>
        Zapisz daty wystawienia
      </Button>
    </div>
  );
}
