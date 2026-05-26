'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ExternalLink, FileUp, GraduationCap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { removeAccountVerificationDocumentAction } from '../app/verification/actions';
import {
  getContractorAccountSettings,
  getOcPolicyAllowedFormatsLabel,
  getVerificationDocumentSignedUrl,
  upsertContractorAccountSettings,
  uploadProfessionalQualificationsScan,
} from '../lib/database/contractor-account';
import { DocumentRemovalAlertDialog } from './verification/DocumentRemovalAlertDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ContractorProfessionalQualificationsSettingsProps {
  userId: string;
  /** When `section`, renders as a row inside the documents upload shell. */
  variant?: 'card' | 'section';
  /** Omit outer section heading when nested in documents tab section D. */
  hideSectionChrome?: boolean;
}

const SCAN_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

const SAVED_TOAST = 'Dane uprawnień zawodowych zostały zapisane';

export function ContractorProfessionalQualificationsSettings({
  userId,
  variant = 'card',
  hideSectionChrome = false,
}: ContractorProfessionalQualificationsSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [validUntil, setValidUntil] = React.useState('');
  const [scanPath, setScanPath] = React.useState<string | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = React.useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        setValidUntil(settings.professionalQualificationsValidUntil ?? '');
        setScanPath(settings.professionalQualificationsScanPath ?? null);
      } catch (error) {
        console.error('Error loading professional qualifications settings:', error);
        toast.error('Nie udało się załadować danych uprawnień zawodowych');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  React.useEffect(() => {
    if (!scanPath) {
      setPreviewSignedUrl(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const url = await getVerificationDocumentSignedUrl(scanPath);
      if (!cancelled) {
        setPreviewSignedUrl(url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scanPath]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const uploadResult = await uploadProfessionalQualificationsScan(userId, file);
      const saved = await upsertContractorAccountSettings(userId, {
        professionalQualificationsScanPath: uploadResult.path,
      });
      if (
        !saved.professionalQualificationsScanPath ||
        saved.professionalQualificationsScanPath !== uploadResult.path
      ) {
        toast.error(
          'Plik został wgrany do magazynu, ale ścieżka nie została zapisana w bazie. Uruchom migrację lub sprawdź RLS.'
        );
        return;
      }
      setScanPath(saved.professionalQualificationsScanPath);
      toast.success(SAVED_TOAST);
      router.refresh();
    } catch (error) {
      console.error('Error uploading qualification scan:', error);
      const message =
        error instanceof Error ? error.message : 'Nie udało się zapisać skanu uprawnień';
      toast.error(message);
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  const handleConfirmRemoveScan = async () => {
    if (!scanPath) return;
    try {
      setIsSaving(true);
      const result = await removeAccountVerificationDocumentAction({
        kind: 'professional_qualifications_scan',
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Nie udało się usunąć skanu uprawnień');
        return;
      }
      setScanPath(null);
      setShowRemoveDialog(false);
      toast.success(
        result.verificationReset
          ? 'Skan usunięty. Uzupełnij dokumenty i prześlij je ponownie do weryfikacji.'
          : 'Skan uprawnień został usunięty',
      );
      router.refresh();
    } catch (error) {
      console.error('Error removing qualification scan:', error);
      toast.error('Nie udało się usunąć skanu uprawnień');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDate = async () => {
    try {
      setIsSaving(true);
      await upsertContractorAccountSettings(userId, {
        professionalQualificationsValidUntil: validUntil || null,
      });
      toast.success(SAVED_TOAST);
      router.refresh();
    } catch (error) {
      console.error('Error saving qualification validity date:', error);
      toast.error('Nie udało się zapisać daty ważności uprawnień');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    const loadingBody = (
      <p className="text-sm text-muted-foreground">Ładowanie danych uprawnień zawodowych...</p>
    );
    if (variant === 'section') {
      return <section className="px-4 py-5 sm:px-6">{loadingBody}</section>;
    }
    return (
      <Card>
        <CardContent className="py-6">{loadingBody}</CardContent>
      </Card>
    );
  }

  const fields = (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-3 sm:p-4">
        <Label htmlFor="pq-valid-until" className="text-xs font-medium">
          Data ważności dokumentu
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="pq-valid-until"
              type="date"
              className="bg-background pl-9"
              value={validUntil}
              onChange={event => setValidUntil(event.target.value)}
            />
          </div>
          <Button onClick={handleSaveDate} disabled={isSaving} size="sm" className="shrink-0">
            Zapisz datę
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-3 sm:p-4">
        <Label htmlFor="pq-scan-file" className="text-xs font-medium">
          Skan uprawnień (certyfikat, licencja)
        </Label>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {getOcPolicyAllowedFormatsLabel()} · maks. 10 MB
        </p>
        <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {scanPath ? (
              <p className="truncate text-sm font-medium" title={scanPath}>
                {scanPath.split('/').pop()}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Brak dodanego skanu</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {scanPath ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isSaving}
                aria-label="Usuń skan"
                onClick={() => setShowRemoveDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            <Button variant="outline" size="sm" disabled={isSaving} className="h-9 shrink-0" asChild>
              <label htmlFor="pq-scan-file" className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" />
                {scanPath ? 'Zamień' : 'Dodaj skan'}
              </label>
            </Button>
            {scanPath && previewSignedUrl ? (
              <Button variant="outline" size="sm" className="h-9 shrink-0" asChild>
                <a href={previewSignedUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Otwórz
                </a>
              </Button>
            ) : null}
            <input
              id="pq-scan-file"
              type="file"
              className="hidden"
              accept={SCAN_ACCEPT}
              onChange={handleUpload}
            />
          </div>
        </div>
        {scanPath && !previewSignedUrl ? (
          <p className="mt-2 text-xs text-destructive">
            Nie udało się przygotować linku do pliku. Zapisz plik ponownie.
          </p>
        ) : null}
      </div>
    </div>
  );

  const removeDialog = (
    <DocumentRemovalAlertDialog
      open={showRemoveDialog}
      onOpenChange={open => {
        if (!open && !isSaving) setShowRemoveDialog(false);
      }}
      onConfirm={handleConfirmRemoveScan}
      isPending={isSaving}
      title="Usunąć skan uprawnień?"
    />
  );

  if (variant === 'section' && hideSectionChrome) {
    return (
      <>
        {fields}
        {removeDialog}
      </>
    );
  }

  if (variant === 'section') {
    return (
      <section id="professional-qualifications" className="scroll-mt-24 px-4 py-5 sm:px-6">
        <div className="mb-4 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Uprawnienia zawodowe</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Opcjonalny
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Certyfikat, licencja lub inny dokument potwierdzający kwalifikacje.
            </p>
          </div>
        </div>
        {fields}
        {removeDialog}
      </section>
    );
  }

  return (
    <>
      <Card className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            Uprawnienia Zawodowe
          </CardTitle>
        </CardHeader>
        <CardContent>{fields}</CardContent>
      </Card>
      {removeDialog}
    </>
  );
}
