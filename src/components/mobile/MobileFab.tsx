import React from 'react';
import { Plus, Briefcase, MapPin, Search, Filter } from 'lucide-react';
import { Button } from '../ui/button';

interface MobileFabProps {
  icon: 'plus' | 'briefcase' | 'map' | 'search' | 'filter';
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'secondary';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const MobileFab: React.FC<MobileFabProps> = ({
  icon,
  onClick,
  label,
  variant = 'primary',
  position = 'bottom-right'
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'plus':
        return <Plus className="h-6 w-6" />;
      case 'briefcase':
        return <Briefcase className="h-6 w-6" />;
      case 'map':
        return <MapPin className="h-6 w-6" />;
      case 'search':
        return <Search className="h-6 w-6" />;
      case 'filter':
        return <Filter className="h-6 w-6" />;
      default:
        return <Plus className="h-6 w-6" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-20 left-4';
      case 'bottom-center':
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-20 right-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white shadow-lg';
      case 'primary':
      default:
        return 'bg-primary text-white hover:bg-primary/90 shadow-lg';
    }
  };

  return (
    <div className={`mobile-fab fixed z-40 ${getPositionClasses()}`}>
      <Button
        onClick={onClick}
        className={`h-14 w-14 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${getVariantClasses()}`}
        size="icon"
      >
        {getIcon()}
      </Button>
      {label && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            {label}
          </div>
          <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
        </div>
      )}
    </div>
  );
};