'use client';

import React from 'react';
import { Calendar, ExternalLink, FileUp, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  getOcPolicyAllowedFormatsLabel,
  getOcPolicyScanSignedUrl,
  upsertContractorAccountSettings,
  uploadOcPolicyScan,
} from '../lib/database/contractor-account';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ContractorInsuranceSettingsProps {
  userId: string;
}

function inferOcScanPreviewKind(path: string): 'pdf' | 'image' | 'unknown' {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  return 'unknown';
}

const OC_POLICY_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

const OC_SETTINGS_SAVED_TOAST = 'Dane ubezpieczenia OC zostały zmienione';

export function ContractorInsuranceSettings({ userId }: ContractorInsuranceSettingsProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [ocValidUntil, setOcValidUntil] = React.useState('');
  const [policyPath, setPolicyPath] = React.useState<string | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        setOcValidUntil(settings.ocValidUntil ?? '');
        setPolicyPath(settings.ocPolicyScanPath);
      } catch (error) {
        console.error('Error loading OC settings:', error);
        toast.error('Nie udało się załadować ustawień OC');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  React.useEffect(() => {
    if (!policyPath) {
      setPreviewSignedUrl(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const url = await getOcPolicyScanSignedUrl(policyPath);
      if (!cancelled) {
        setPreviewSignedUrl(url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [policyPath]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const uploadResult = await uploadOcPolicyScan(userId, file);
      const saved = await upsertContractorAccountSettings(userId, { ocPolicyScanPath: uploadResult.path });
      if (!saved.ocPolicyScanPath || saved.ocPolicyScanPath !== uploadResult.path) {
        toast.error(
          'Plik został wgrany do magazynu, ale ścieżka nie została zapisana w bazie. Uruchom migrację contractor_account_settings lub sprawdź RLS.'
        );
        return;
      }
      setPolicyPath(saved.ocPolicyScanPath);
      toast.success(OC_SETTINGS_SAVED_TOAST);
    } catch (error) {
      console.error('Error uploading OC policy:', error);
      const message =
        error instanceof Error ? error.message : 'Nie udało się zapisać skanu polisy';
      toast.error(message);
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  const handleSaveDate = async () => {
    try {
      setIsSaving(true);
      await upsertContractorAccountSettings(userId, {
        ocValidUntil: ocValidUntil || null,
      });
      toast.success(OC_SETTINGS_SAVED_TOAST);
    } catch (error) {
      console.error('Error saving OC date:', error);
      toast.error('Nie udało się zapisać daty ważności OC');
    } finally {
      setIsSaving(false);
    }
  };

  const previewKind = policyPath ? inferOcScanPreviewKind(policyPath) : 'unknown';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Ładowanie danych OC...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Ubezpieczenie OC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="oc-valid-until">Data ważności OC</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="oc-valid-until"
                type="date"
                className="pl-9"
                value={ocValidUntil}
                onChange={(event) => setOcValidUntil(event.target.value)}
              />
            </div>
            <Button onClick={handleSaveDate} disabled={isSaving}>
              Zapisz
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oc-policy-file">Skan polisy OC</Label>
          <p className="text-xs text-muted-foreground">
            Dozwolone formaty: {getOcPolicyAllowedFormatsLabel()} · maks. 10 MB
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" disabled={isSaving} asChild>
              <label htmlFor="oc-policy-file" className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" />
                Dodaj skan polisy
              </label>
            </Button>
            <input
              id="oc-policy-file"
              type="file"
              className="hidden"
              accept={OC_POLICY_ACCEPT}
              onChange={handleUpload}
            />
            {policyPath ? (
              <span className="text-xs text-muted-foreground">Plik zapisany: {policyPath.split('/').pop()}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Brak dodanego skanu</span>
            )}
          </div>

          {policyPath && !previewSignedUrl ? (
            <p className="text-xs text-destructive">
              Nie udało się przygotować podglądu. Sprawdź uprawnienia do magazynu plików lub otwórz plik ponownie po
              zapisaniu.
            </p>
          ) : null}

          {previewSignedUrl ? (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-foreground">Podgląd</span>
                <Button variant="outline" size="sm" className="h-8" asChild>
                  <a href={previewSignedUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Otwórz w nowej karcie
                  </a>
                </Button>
              </div>

              {previewKind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL, dynamic user upload
                <img
                  src={previewSignedUrl}
                  alt="Skan polisy OC"
                  className="mx-auto max-h-[min(420px,55vh)] w-auto max-w-full rounded border bg-background object-contain"
                />
              ) : null}

              {previewKind === 'pdf' ? (
                <div className="space-y-2">
                  <iframe
                    title="Podgląd PDF polisy OC"
                    src={previewSignedUrl}
                    className="h-[min(480px,60vh)] w-full rounded border bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jeśli podgląd PDF się nie wczytuje, użyj „Otwórz w nowej karcie” — niektóre przeglądarki blokują
                    iframe dla dokumentów.
                  </p>
                </div>
              ) : null}

              {previewKind === 'unknown' ? (
                <p className="text-xs text-muted-foreground">
                  Podgląd inline nie jest dostępny dla tego typu pliku. Użyj przycisku „Otwórz w nowej karcie”.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
