'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import { PROFESSIONAL_QUALIFICATION_GROUPS } from '../lib/contractor/constants';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface ContractorProfessionalQualificationsChecklistProps {
  userId: string;
}

export function ContractorProfessionalQualificationsChecklist({
  userId,
}: ContractorProfessionalQualificationsChecklistProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        setSelected(settings.professionalQualificationTypes);
      } catch (error) {
        console.error(error);
        toast.error('Nie udało się załadować uprawnień');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await upsertContractorAccountSettings(userId, {
        professionalQualificationTypes: selected,
      });
      toast.success('Lista uprawnień zapisana');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Nie udało się zapisać uprawnień');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Ładowanie listy uprawnień…</p>;
  }

  return (
    <div className="space-y-4">
      {PROFESSIONAL_QUALIFICATION_GROUPS.map(group => (
        <QualificationGroup
          key={group.title}
          title={group.title}
          options={group.options}
          selected={selected}
          onToggle={toggle}
        />
      ))}
      <Button type="button" size="sm" disabled={isSaving} onClick={handleSave}>
        {isSaving ? 'Zapisywanie…' : 'Zapisz zaznaczone uprawnienia'}
      </Button>
    </div>
  );
}

function QualificationGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.id} className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selected.includes(option.id)}
              onCheckedChange={() => onToggle(option.id)}
              className="mt-0.5"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
