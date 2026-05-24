'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import { VAT_STATUS_OPTIONS } from '../lib/contractor/constants';
import { formatIbanDisplay, isValidPolishIban, normalizeIbanInput } from '../lib/contractor/iban';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ContractorFinanceSettingsProps {
  userId: string;
}

export function ContractorFinanceSettings({ userId }: ContractorFinanceSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [iban, setIban] = React.useState('');
  const [vatStatus, setVatStatus] = React.useState<string>('');
  const [savedIban, setSavedIban] = React.useState('');
  const [savedVatStatus, setSavedVatStatus] = React.useState<string>('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        const ibanValue = settings.bankAccountIban ?? '';
        const vatValue = settings.vatStatus ?? '';
        setIban(ibanValue);
        setVatStatus(vatValue);
        setSavedIban(ibanValue);
        setSavedVatStatus(vatValue);
      } catch (error) {
        console.error('Error loading finance settings:', error);
        toast.error('Nie udało się załadować danych finansowych');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  const handleSave = async () => {
    const normalized = normalizeIbanInput(iban);
    if (normalized && !isValidPolishIban(normalized)) {
      toast.error('Numer konta bankowego musi składać się z 26 cyfr');
      return;
    }

    try {
      setIsSaving(true);
      await upsertContractorAccountSettings(userId, {
        bankAccountIban: normalized || null,
        vatStatus: vatStatus === 'active_vat' || vatStatus === 'vat_exempt' ? vatStatus : null,
      });
      setSavedIban(normalized);
      setSavedVatStatus(vatStatus);
      setIban(normalized);
      setIsEditing(false);
      toast.success('Dane finansowe zostały zapisane');
      router.refresh();
    } catch (error) {
      console.error('Error saving finance settings:', error);
      toast.error('Nie udało się zapisać danych finansowych');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIban(savedIban);
    setVatStatus(savedVatStatus);
    setIsEditing(false);
  };

  const vatLabel =
    VAT_STATUS_OPTIONS.find(o => o.value === savedVatStatus)?.label ?? '—';

  return (
    <div className="border rounded-lg p-4 bg-card">
      <FinanceCardHeader
        isLoading={isLoading}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={() => setIsEditing(true)}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie danych finansowych…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contractor-iban">Numer konta bankowego (IBAN)</Label>
            {isEditing ? (
              <>
                <Input
                  id="contractor-iban"
                  value={formatIbanDisplay(iban)}
                  onChange={e => setIban(normalizeIbanInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="26 cyfr bez prefiksu PL"
                  maxLength={32}
                />
                <p className="text-xs text-muted-foreground">Wprowadź 26 cyfr numeru rachunku (bez PL).</p>
              </>
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {savedIban ? formatIbanDisplay(savedIban) : '—'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractor-vat-status">Status podatnika VAT</Label>
            {isEditing ? (
              <Select value={vatStatus || undefined} onValueChange={setVatStatus}>
                <SelectTrigger id="contractor-vat-status">
                  <SelectValue placeholder="Wybierz status VAT" />
                </SelectTrigger>
                <SelectContent>
                  {VAT_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{vatLabel}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceCardHeader({
  isLoading,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: {
  isLoading: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-medium flex items-center gap-2">
        <Banknote className="h-4 w-4 text-muted-foreground" aria-hidden />
        Rozliczenia i finanse
      </h4>
      {isLoading ? (
        <span className="text-xs text-muted-foreground">Ładowanie…</span>
      ) : !isEditing ? (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edytuj
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Anuluj
          </Button>
          <Button variant="default" size="sm" onClick={onSave} disabled={isSaving}>
            <Check className="h-4 w-4 mr-2" />
            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </div>
      )}
    </div>
  );
}
