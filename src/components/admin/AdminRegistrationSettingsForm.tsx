'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { updateRegistrationSettingsAction } from '../../app/admin/actions';
import type { RegistrationSettings } from '../../lib/registration-settings-shared';

interface AdminRegistrationSettingsFormProps {
  initialSettings: RegistrationSettings;
}

export function AdminRegistrationSettingsForm({
  initialSettings,
}: AdminRegistrationSettingsFormProps) {
  const [contractorOpen, setContractorOpen] = useState(initialSettings.contractorOpen);
  const [managerOpen, setManagerOpen] = useState(initialSettings.managerOpen);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRegistrationSettingsAction(contractorOpen, managerOpen);
      if (result.ok) {
        toast.success('Ustawienia rejestracji zostały zapisane');
      } else {
        toast.error(result.error ?? 'Nie udało się zapisać ustawień');
      }
    });
  };

  const hasChanges =
    contractorOpen !== initialSettings.contractorOpen ||
    managerOpen !== initialSettings.managerOpen;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rejestracja nowych użytkowników</CardTitle>
        <CardDescription>
          Wstrzymaj rejestrację osobno dla wykonawców i zarządców. Istniejące konta nie są
          dotknięte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="contractor-registration">Rejestracja wykonawców</Label>
            <p className="text-sm text-muted-foreground">
              {contractorOpen
                ? 'Nowi wykonawcy mogą zakładać konta'
                : 'Rejestracja wykonawców jest wstrzymana'}
            </p>
          </div>
          <Switch
            id="contractor-registration"
            checked={contractorOpen}
            onCheckedChange={setContractorOpen}
            disabled={isPending}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="manager-registration">Rejestracja zarządców</Label>
            <p className="text-sm text-muted-foreground">
              {managerOpen
                ? 'Nowi zarządcy mogą zakładać konta'
                : 'Rejestracja zarządców jest wstrzymana'}
            </p>
          </div>
          <Switch
            id="manager-registration"
            checked={managerOpen}
            onCheckedChange={setManagerOpen}
            disabled={isPending}
          />
        </div>
        <Button type="button" onClick={handleSave} disabled={isPending || !hasChanges}>
          {isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </Button>
      </CardContent>
    </Card>
  );
}
