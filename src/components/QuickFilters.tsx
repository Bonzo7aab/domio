// COMPONENT REMOVED - Quick filters functionality has been removed
// This file is kept for potential future use
import React, { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Clock, 
  Star, 
  Shield, 
  Zap, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  Filter,
  X
} from 'lucide-react';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  count: number;
  description: string;
}

interface QuickFiltersProps {
  onFilterSelect: (filterId: string) => void;
  selectedFilters: string[];
  onClearAll: () => void;
}

const quickFilters: QuickFilter[] = [
  {
    id: 'urgent',
    label: 'Pilne zlecenia',
    icon: Zap,
    color: 'destructive',
    count: 12,
    description: 'Zlecenia wymagające natychmiastowej realizacji'
  },
  {
    id: 'verified',
    label: 'Zweryfikowani klienci',
    icon: Shield,
    color: 'success',
    count: 89,
    description: 'Klienci z potwierdzoną tożsamością i dobrą opinią'
  },
  {
    id: 'high-paying',
    label: 'Wysokie stawki (100+ zł/h)',
    icon: DollarSign,
    color: 'warning',
    count: 34,
    description: 'Zlecenia z najwyższymi stawkami godzinowymi'
  },
  {
    id: 'premium',
    label: 'Premium wykonawcy',
    icon: Star,
    color: 'primary',
    count: 56,
    description: 'Zlecenia zarezerwowane dla zweryfikowanych wykonawców'
  },
  {
    id: 'insured',
    label: 'Z ubezpieczeniem OC',
    icon: Shield,
    color: 'default',
    count: 78,
    description: 'Klienci posiadający ubezpieczenie odpowiedzialności cywilnej'
  },
  {
    id: 'long-term',
    label: 'Długoterminowe',
    icon: Clock,
    color: 'default',
    count: 45,
    description: 'Kontrakty na 6+ miesięcy'
  },
  {
    id: 'nearby',
    label: 'W okolicy',
    icon: MapPin,
    color: 'default',
    count: 23,
    description: 'Zlecenia w promieniu 25km'
  },
  {
    id: 'trending',
    label: 'Popularne dziś',
    icon: TrendingUp,
    color: 'primary',
    count: 18,
    description: 'Najczęściej przeglądane zlecenia'
  }
];

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  onFilterSelect,
  selectedFilters,
  onClearAll
}) => {
  const [showAll, setShowAll] = useState(false);
  
  const visibleFilters = showAll ? quickFilters : quickFilters.slice(0, 6);

  const getFilterVariant = (filter: QuickFilter, isSelected: boolean) => {
    if (isSelected) {
      switch (filter.color) {
        case 'primary':
          return 'default';
        case 'success':
          return 'default';
        case 'warning':
          return 'default';
        case 'destructive':
          return 'destructive';
        default:
          return 'default';
      }
    }
    return 'secondary';
  };

  const getFilterStyle = (filter: QuickFilter, isSelected: boolean) => {
    if (!isSelected) return {};
    
    switch (filter.color) {
      case 'success':
        return { backgroundColor: 'var(--success)', color: 'var(--success-foreground)' };
      case 'warning':
        return { backgroundColor: 'var(--warning)', color: 'var(--warning-foreground)' };
      case 'destructive':
        return { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' };
      case 'primary':
        return { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Szybkie filtry</span>
          {selectedFilters.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedFilters.length} aktywne
            </Badge>
          )}
        </div>
        
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Wyczyść
          </Button>
        )}
      </div>

      {/* Filter Badges */}
      <div className="flex flex-wrap gap-2">
        {visibleFilters.map((filter) => {
          const isSelected = selectedFilters.includes(filter.id);
          const IconComponent = filter.icon;
          
          return (
            <Badge
              key={filter.id}
              variant={getFilterVariant(filter, isSelected)}
              style={getFilterStyle(filter, isSelected)}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSelected 
                  ? 'shadow-md ring-2 ring-offset-1 ring-current/20' 
                  : 'hover:bg-muted-foreground/10'
              }`}
              onClick={() => onFilterSelect(filter.id)}
            >
              <IconComponent className="h-3 w-3 mr-1" />
              {filter.label}
              <span className="ml-1 text-xs opacity-75">
                ({filter.count})
              </span>
            </Badge>
          );
        })}
        
        {quickFilters.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-auto py-1 px-2 text-xs border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
          >
            {showAll ? 'Mniej' : `+${quickFilters.length - 6} więcej`}
          </Button>
        )}
      </div>

      {/* Selected Filter Descriptions */}
      {selectedFilters.length > 0 && (
        <div className="space-y-1">
          {selectedFilters.map(filterId => {
            const filter = quickFilters.find(f => f.id === filterId);
            if (!filter) return null;
            
            return (
              <div key={filterId} className="text-xs text-muted-foreground flex items-center">
                <filter.icon className="h-3 w-3 mr-1" />
                <span>{filter.description}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};