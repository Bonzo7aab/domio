import React from 'react';
import { MapPin, List } from 'lucide-react';
import { Button } from './ui/button';

interface MobileMapToggleProps {
  showMap: boolean;
  onToggle: () => void;
  jobCount: number;
}

export const MobileMapToggle: React.FC<MobileMapToggleProps> = ({
  showMap,
  onToggle,
  jobCount
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
      <Button 
        onClick={onToggle}
        size="lg"
        className="bg-primary text-white shadow-lg px-6 py-3 rounded-full"
      >
        {showMap ? (
          <>
            <List className="w-5 h-5 mr-2" />
            Lista ({jobCount})
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5 mr-2" />
            Mapa
          </>
        )}
      </Button>
    </div>
  );
};

export default MobileMapToggle;