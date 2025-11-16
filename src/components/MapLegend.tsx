'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { markerColors } from '../lib/google-maps/config';

export const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems = [
    {
      color: markerColors.default.background,
      label: 'Standardowe zlecenie',
      description: 'Zwykłe ogłoszenie',
    },
    {
      color: markerColors.selected.background,
      label: 'Wybrane zlecenie',
      description: 'Aktualnie przeglądane',
    },
    {
      color: markerColors.urgent.background,
      label: 'Pilne zlecenie',
      description: 'Wymaga szybkiej reakcji',
    },
  ];

  return (
    <Card className="w-[280px] shadow-lg bg-white border-border">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Legenda</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Zwiń legendę' : 'Rozwiń legendę'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 pt-0 space-y-2">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="flex-shrink-0"
                style={{
                  backgroundColor: item.color,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground leading-tight">
                  {item.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default MapLegend;




