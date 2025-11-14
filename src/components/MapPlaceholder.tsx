import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from './ui/button';

interface MapPlaceholderProps {
  onToggleExpand?: () => void;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ onToggleExpand }) => {
  return (
    <div className="w-80 h-[250px] m-2 relative rounded-lg border inset-shadow border-gray-300 overflow-hidden bg-gray-100 p-4">
      {/* Blurred background image */}
      <div 
        className="absolute inset-0 -m-4"
        style={{
          backgroundImage: 'url(/map-placeholder.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.1)',
        }}
      />
      
      {/* Overlay to ensure button visibility */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Centered Button */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <Button
          onClick={onToggleExpand}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 py-3 h-auto font-medium"
          size="lg"
        >
          <MapPin className="w-5 h-5 mr-2" />
          Mapa
        </Button>
      </div>

      {/* Google Maps attribution style text */}
      <div className="absolute bottom-6 right-6 text-xs text-gray-400 opacity-50 z-10">
        Map data ©2025
      </div>
    </div>
  );
};

export default MapPlaceholder;

