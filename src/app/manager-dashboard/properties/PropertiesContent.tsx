"use client";

import { Building as BuildingIcon, Building2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { BUILDING_TYPE_OPTIONS } from '../../../types/building';
import { getBuildingImageUrl } from '../../../components/manager-dashboard/shared/utils';
import type { Building } from '../../../types/building';

interface PropertiesContentProps {
  buildings: Building[];
}

export function PropertiesContent({ buildings }: PropertiesContentProps) {
  if (buildings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <BuildingIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Brak zarejestrowanych budynków</h3>
          <p className="text-gray-600 mb-4">Nie posiadasz jeszcze zarejestrowanych budynków w portfolio.</p>
          <p className="text-sm text-gray-500">
            Przejdź do sekcji "Firma" w ustawieniach konta, aby dodać budynki.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {buildings.map((building) => {
        // Get first image URL if available
        const firstImage = building.images && building.images.length > 0 
          ? building.images[0] 
          : null;
        const imageUrl = getBuildingImageUrl(firstImage);
        
        return (
          <Card key={building.id}>
            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden flex items-center justify-center relative">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={building.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <Building2 className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <CardHeader>
              <CardTitle>{building.name}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{building.street_address}, {building.city}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {building.building_type && (
                  <Badge variant="secondary">
                    {BUILDING_TYPE_OPTIONS.find(opt => opt.value === building.building_type)?.label || building.building_type}
                  </Badge>
                )}
                <div className="grid grid-cols-3 gap-4 text-center">
                  {building.year_built && (
                    <div>
                      <div className="font-bold text-lg">{building.year_built}</div>
                      <div className="text-sm text-gray-600">Rok budowy</div>
                    </div>
                  )}
                  {building.units_count !== null && (
                    <div>
                      <div className="font-bold text-lg">{building.units_count}</div>
                      <div className="text-sm text-gray-600">Lokali</div>
                    </div>
                  )}
                  {building.floors_count !== null && (
                    <div>
                      <div className="font-bold text-lg">{building.floors_count}</div>
                      <div className="text-sm text-gray-600">Pięter</div>
                    </div>
                  )}
                </div>
                {building.notes && (
                  <p className="text-sm text-gray-600 mt-2">{building.notes}</p>
                )}
                {building.postal_code && (
                  <p className="text-xs text-gray-500">Kod pocztowy: {building.postal_code}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
