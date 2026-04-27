'use client';

import React from 'react';
import { Calendar, FileUp, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  getOcPolicyScanPublicUrl,
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

export function ContractorInsuranceSettings({ userId }: ContractorInsuranceSettingsProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [ocValidUntil, setOcValidUntil] = React.useState('');
  const [policyPath, setPolicyPath] = React.useState<string | null>(null);
  const [policyUrl, setPolicyUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        setOcValidUntil(settings.ocValidUntil ?? '');
        setPolicyPath(settings.ocPolicyScanPath);
        if (settings.ocPolicyScanPath) {
          setPolicyUrl(getOcPolicyScanPublicUrl(settings.ocPolicyScanPath));
        }
      } catch (error) {
        console.error('Error loading OC settings:', error);
        toast.error('Nie udało się załadować ustawień OC');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const uploadResult = await uploadOcPolicyScan(userId, file);
      await upsertContractorAccountSettings(userId, { ocPolicyScanPath: uploadResult.path });
      setPolicyPath(uploadResult.path);
      setPolicyUrl(uploadResult.publicUrl);
      toast.success('Skan polisy OC został zapisany');
    } catch (error) {
      console.error('Error uploading OC policy:', error);
      toast.error('Nie udało się zapisać skanu polisy');
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
      toast.success('Data ważności OC została zapisana');
    } catch (error) {
      console.error('Error saving OC date:', error);
      toast.error('Nie udało się zapisać daty ważności OC');
    } finally {
      setIsSaving(false);
    }
  };

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
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleUpload}
            />
            {policyPath ? (
              <span className="text-xs text-muted-foreground">Plik zapisany: {policyPath.split('/').pop()}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Brak dodanego skanu</span>
            )}
          </div>
          {policyUrl ? (
            <a
              href={policyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-primary hover:underline"
            >
              Podgląd skanu polisy
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

