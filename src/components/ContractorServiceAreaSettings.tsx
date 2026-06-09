'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import {
  DEFAULT_SERVICE_AREA,
  type ContractorServiceAreaSettings as ServiceAreaSettings,
} from '../lib/contractor/constants';

interface ContractorServiceAreaSettingsProps {
  userId: string;
}

const POLAND_SERVICE_AREA: ServiceAreaSettings = {
  ...DEFAULT_SERVICE_AREA,
  scope: 'whole_voivodeship',
  cities: [],
  districts: [],
};

export function ContractorServiceAreaSettings({ userId }: ContractorServiceAreaSettingsProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        const needsMigration =
          settings.serviceArea.scope !== 'whole_voivodeship' ||
          settings.serviceArea.cities.length > 0 ||
          settings.serviceArea.districts.length > 0;

        if (needsMigration) {
          await upsertContractorAccountSettings(userId, {
            serviceArea: POLAND_SERVICE_AREA,
            radar: { ...settings.radar, areas: [] },
          });
        }
      } catch (error) {
        console.error('Error loading service area:', error);
        toast.error('Nie udało się załadować obszaru działalności');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
          Obszar działalności
        </h4>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Ładowanie…</span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie obszaru działalności…</p>
      ) : (
        <p className="text-sm">
          <span className="text-muted-foreground">Kraj: </span>
          <span className="font-medium">Polska</span>
        </p>
      )}
    </div>
  );
}
