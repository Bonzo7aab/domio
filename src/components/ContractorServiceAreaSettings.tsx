'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractorAccountSettings,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import {
  CITIES_BY_VOIVODESHIP,
  DEFAULT_CITY,
  DEFAULT_SERVICE_AREA,
  POLISH_VOIVODESHIPS,
  WARSAW_DISTRICTS,
  type ContractorServiceAreaSettings as ServiceAreaSettings,
  type PolishVoivodeship,
  type ServiceAreaScope,
} from '../lib/contractor/constants';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface ContractorServiceAreaSettingsProps {
  userId: string;
}

export function ContractorServiceAreaSettings({ userId }: ContractorServiceAreaSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [area, setArea] = React.useState<ServiceAreaSettings>(DEFAULT_SERVICE_AREA);
  const [savedArea, setSavedArea] = React.useState<ServiceAreaSettings>(DEFAULT_SERVICE_AREA);

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getContractorAccountSettings(userId);
        setArea(settings.serviceArea);
        setSavedArea(settings.serviceArea);
      } catch (error) {
        console.error('Error loading service area:', error);
        toast.error('Nie udało się załadować obszaru działalności');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  const cityOptions = CITIES_BY_VOIVODESHIP[area.voivodeship] ?? [DEFAULT_CITY];
  const showDistricts = area.cities.includes(DEFAULT_CITY);

  const handleVoivodeshipChange = (value: string) => {
    const voivodeship = value as PolishVoivodeship;
    const cities = CITIES_BY_VOIVODESHIP[voivodeship] ?? [DEFAULT_CITY];
    setArea(prev => ({
      ...prev,
      voivodeship,
      cities: prev.scope === 'selected_cities' ? [cities[0]] : prev.cities,
      districts: cities.includes(DEFAULT_CITY) ? prev.districts : [],
    }));
  };

  const toggleCity = (city: string) => {
    setArea(prev => {
      const selected = prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city];
      const nextCities = selected.length > 0 ? selected : [city];
      return {
        ...prev,
        cities: nextCities,
        districts: nextCities.includes(DEFAULT_CITY) ? prev.districts : [],
      };
    });
  };

  const toggleDistrict = (district: string) => {
    setArea(prev => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter(d => d !== district)
        : [...prev.districts, district],
    }));
  };

  const handleSave = async () => {
    if (area.scope === 'selected_cities' && area.cities.length === 0) {
      toast.error('Wybierz co najmniej jedno miasto');
      return;
    }

    try {
      setIsSaving(true);
      const settings = await getContractorAccountSettings(userId);
      await upsertContractorAccountSettings(userId, {
        serviceArea: area,
        radar: { ...settings.radar, areas: area.cities },
      });
      setSavedArea(area);
      setIsEditing(false);
      toast.success('Obszar działalności został zapisany');
      router.refresh();
    } catch (error) {
      console.error('Error saving service area:', error);
      toast.error('Nie udało się zapisać obszaru działalności');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setArea(savedArea);
    setIsEditing(false);
  };

  const scopeLabel =
    savedArea.scope === 'whole_voivodeship'
      ? 'Całe województwo'
      : savedArea.cities.join(', ');

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
          Obszar działalności
        </h4>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Ładowanie…</span>
        ) : !isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Anuluj
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
              <Check className="h-4 w-4 mr-2" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie obszaru działalności…</p>
      ) : !isEditing ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Województwo: </span>
            <span className="capitalize">{savedArea.voivodeship}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Zasięg: </span>
            {scopeLabel}
          </p>
          {savedArea.districts.length > 0 && (
            <ServiceAreaDistrictBadges districts={savedArea.districts} />
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="service-voivodeship">Województwo</Label>
            <select
              id="service-voivodeship"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={area.voivodeship}
              onChange={e => handleVoivodeshipChange(e.target.value)}
            >
              {POLISH_VOIVODESHIPS.map(v => (
                <option key={v} value={v} className="capitalize">
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Zasięg</Label>
            <RadioGroup
              value={area.scope}
              onValueChange={value => setArea(prev => ({ ...prev, scope: value as ServiceAreaScope }))}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="whole_voivodeship" id="scope-whole" />
                <Label htmlFor="scope-whole" className="font-normal cursor-pointer">
                  Całe województwo
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="selected_cities" id="scope-selected" />
                <Label htmlFor="scope-selected" className="font-normal cursor-pointer">
                  Wybrane miasta i powiaty
                </Label>
              </div>
            </RadioGroup>

            {area.scope === 'selected_cities' && (
              <div className="ml-1 space-y-4 border-l pl-4">
                <div className="space-y-2">
                  <Label>Miejscowości</Label>
                  <div className="flex flex-wrap gap-2">
                    {cityOptions.map(city => {
                      const selected = area.cities.includes(city);
                      return (
                        <Button
                          key={city}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          onClick={() => toggleCity(city)}
                        >
                          {city}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {showDistricts && (
                  <div className="space-y-2">
                    <Label>Dzielnice (Warszawa)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {WARSAW_DISTRICTS.map(district => (
                        <label key={district} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={area.districts.includes(district)}
                            onCheckedChange={() => toggleDistrict(district)}
                          />
                          {district}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceAreaDistrictBadges({ districts }: { districts: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span className="text-muted-foreground text-sm">Dzielnice: </span>
      {districts.map(d => (
        <Badge key={d} variant="secondary">
          {d}
        </Badge>
      ))}
    </div>
  );
}
