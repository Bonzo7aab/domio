export const googleMapsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry', 'marker'] as const,
  language: 'pl',
  region: 'PL',
};

export const mapOptions = {
  zoom: 11, // District-level view
  center: { lat: 52.1394, lng: 21.0458 }, // Ursynów, Warsaw
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Advanced marker pin colors
export const markerColors = {
  default: {
    background: '#3b82f6', // blue
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
  selected: {
    background: '#ef4444', // light red
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
  urgent: {
    background: '#dc2626', // dark red
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
};
