'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { markerColors, createMarkerGlyph } from '../lib/google-maps/config';

interface MapLegendProps {
  initialExpanded?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ initialExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const priorityItems = [
    {
      backgroundColor: markerColors.priority.low,
      label: 'Niski priorytet',
      description: 'Zielone tło',
    },
    {
      backgroundColor: markerColors.priority.medium,
      label: 'Średni priorytet',
      description: 'Niebieskie tło',
    },
    {
      backgroundColor: markerColors.priority.high,
      label: 'Wysoki priorytet',
      description: 'Czerwone tło',
    },
  ];

  const jobTypeItems = [
    {
      postType: 'job' as const,
      backgroundColor: markerColors.priority.medium, // Use medium priority as default
      label: 'Zlecenie',
      description: 'Ikona klucza',
    },
    {
      postType: 'tender' as const,
      backgroundColor: markerColors.priority.medium, // Use medium priority as default
      label: 'Przetarg',
      description: 'Ikona młotka',
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
        <CardContent className="p-2 md:p-3 pt-0 space-y-3">
          {/* Priority Background Colors Section */}
          <div className="space-y-1 md:space-y-2">
            <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Priorytet (kolory tła)
            </div>
            {priorityItems.map((item, index) => (
              <div key={`priority-${index}`} className="flex items-center gap-2 md:gap-3">
                <div
                  className="flex-shrink-0 w-3 h-3 md:w-4 md:h-4 rounded-full"
                  style={{
                    backgroundColor: item.backgroundColor,
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
          </div>

          {/* Job Type Icons Section */}
          <div className="space-y-1 md:space-y-2 border-t border-border pt-2">
            <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Typ zlecenia (ikony)
            </div>
            {jobTypeItems.map((item, index) => (
              <JobTypeLegendItem
                key={`type-${index}`}
                postType={item.postType}
                backgroundColor={item.backgroundColor}
                label={item.label}
                description={item.description}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Component to render job type icon in legend
const JobTypeLegendItem: React.FC<{
  postType: 'job' | 'tender';
  backgroundColor: string;
  label: string;
  description: string;
}> = ({ postType, backgroundColor, label, description }) => {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      // Clear any existing content
      iconRef.current.innerHTML = '';
      // Create and append the SVG icon with white fill and colored outline
      const icon = createMarkerGlyph(postType, backgroundColor);
      iconRef.current.appendChild(icon);
    }
  }, [postType, backgroundColor]);

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div
        className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: backgroundColor, // Use priority color background
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <div
            ref={iconRef}
            className="flex items-center justify-center"
            style={{ width: '18px', height: '18px' }}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs md:text-sm font-medium text-foreground leading-tight truncate">
          {label}
        </div>
        <div className="text-[10px] md:text-xs text-muted-foreground truncate">
          {description}
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
