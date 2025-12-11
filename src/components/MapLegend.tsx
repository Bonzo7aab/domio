'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { markerColors } from '../lib/google-maps/config';

interface MapLegendProps {
  initialExpanded?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ initialExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

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
    <Card className="w-[180px] md:w-[280px] shadow-lg bg-white border-border gap-3">
      <CardHeader className="p-2 md:p-3 pb-1 md:pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs md:text-sm font-semibold text-foreground">Legenda</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 md:h-6 md:w-6"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Zwiń legendę' : 'Rozwiń legendę'}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
            ) : (
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-2 md:p-3 pt-0 space-y-1 md:space-y-2 ">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 md:gap-3">
              <div
                className="flex-shrink-0 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white"
                style={{
                  backgroundColor: item.color,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs md:text-sm font-medium text-foreground leading-tight truncate">
                  {item.label}
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground truncate">
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




