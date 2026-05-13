'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ExternalLink, FileUp, GraduationCap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  getOcPolicyAllowedFormatsLabel,
  getVerificationDocumentSignedUrl,
  removeVerificationDocumentsFromBucket,
  upsertContractorAccountSettings,
  uploadProfessionalQualificationsScan,
} from '../lib/database/contractor-account';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ContractorProfessionalQualificationsSettingsProps {
  userId: string;
}

const SCAN_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

const SAVED_TOAST = 'Dane uprawnień zawodowych zostały zapisane';

export function ContractorProfessionalQualificationsSettings({
  userId,
}: ContractorProfessionalQualificationsSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [validUntil, setValidUntil] = React.useState('');
  const [scanPath, setScanPath] = React.useState<string | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = React.useState<string | null>(null);

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

  const handleRemoveScan = async () => {
    if (!scanPath) return;
    if (!window.confirm('Czy na pewno chcesz usunąć skan uprawnień? Plik zostanie usunięty z magazynu.')) {
      return;
    }
    try {
      setIsSaving(true);
      await removeVerificationDocumentsFromBucket([scanPath]);
      await upsertContractorAccountSettings(userId, { professionalQualificationsScanPath: null });
      setScanPath(null);
      toast.success('Skan uprawnień został usunięty');
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
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Ładowanie danych uprawnień zawodowych...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4" />
          Uprawnienia Zawodowe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pq-valid-until">Data ważności dokumentu</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="pq-valid-until"
                type="date"
                className="pl-9"
                value={validUntil}
                onChange={(event) => setValidUntil(event.target.value)}
              />
            </div>
            <Button onClick={handleSaveDate} disabled={isSaving}>
              Zapisz
            </Button>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="pq-scan-file">Skan uprawnień (certyfikat, licencja)</Label>
          <p className="text-xs text-muted-foreground">
            Dozwolone formaty: {getOcPolicyAllowedFormatsLabel()} · maks. 10 MB
          </p>
          <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 shadow-sm sm:flex-row sm:items-center sm:gap-0 sm:px-3 sm:py-2.5">
            <div className="min-w-0 flex-1 sm:border-r sm:border-border/70 sm:pr-4">
              {scanPath ? (
                <p className="truncate text-left text-sm leading-snug" title={scanPath}>
                  <span className="text-muted-foreground">Plik zapisany: </span>
                  <span className="font-medium text-foreground">{scanPath.split('/').pop()}</span>
                </p>
              ) : (
                <p className="text-left text-sm leading-snug text-muted-foreground">Brak dodanego skanu</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
              {scanPath ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isSaving}
                  aria-label="Usuń skan"
                  onClick={() => void handleRemoveScan()}
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
                    Otwórz w nowej karcie
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
            <p className="text-xs text-destructive">
              Nie udało się przygotować linku do pliku. Sprawdź uprawnienia do magazynu plików lub zapisz plik
              ponownie.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
