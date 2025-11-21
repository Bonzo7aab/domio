export interface GeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  formattedAddress: string;
  placeId?: string;
}

export interface ReverseGeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  components: {
    city?: string;
    district?: string;
    country?: string;
    postalCode?: string;
    sublocality_level_1?: string;
  };
}

// Geocode an address to get coordinates
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  if (!window.google?.maps?.Geocoder) {
    // Don't log error here - let the caller handle fallback
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        resolve({
          address,
          coordinates: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          },
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
        });
      } else {
        console.error('Geocoding failed:', status);
        resolve(null);
      }
    });
  });
};

// Reverse geocode coordinates to get address
export const reverseGeocode = async (
  lat: number, 
  lng: number
): Promise<ReverseGeocodingResult | null> => {
  if (!window.google?.maps?.Geocoder) {
    console.error('Google Maps Geocoder not loaded');
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const components: any = {};
        
        // Extract address components
        result.address_components.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) {
            components.city = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            components.district = component.long_name;
          } else if (types.includes('country')) {
            components.country = component.long_name;
          } else if (types.includes('postal_code')) {
            components.postalCode = component.long_name;
          } else if (types.includes('sublocality_level_1')) {
            components.sublocality_level_1 = component.long_name;
          }
        });

        resolve({
          address: result.formatted_address,
          coordinates: { lat, lng },
          components,
        });
      } else {
        console.error('Reverse geocoding failed:', status);
        resolve(null);
      }
    });
  });
};

// Get current location using browser geolocation
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};
