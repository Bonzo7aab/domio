'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { googleMapsConfig, mapOptions, markerColors } from '../lib/google-maps/config';
import { generateInfoWindowContent } from '../lib/google-maps/infoWindowContent';
import { Job } from '../types/job';

interface GoogleMapProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onMarkerClick?: (markerId: string) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
  style?: React.CSSProperties;
  isMapExpanded?: boolean;
  isSmallMap?: boolean;
}

const MapComponent: React.FC<{
  markers: MapMarker[];
  center: { lat: number; lng: number };
  zoom: number;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onMarkerClick?: (markerId: string) => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  isMapExpanded?: boolean;
  isSmallMap?: boolean;
}> = ({ markers, center, zoom, onMapClick, onMarkerClick, onBoundsChanged, isMapExpanded = false, isSmallMap = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [mapMarkers, setMapMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const mapMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringInfoWindowRef = useRef<boolean>(false);
  const boundsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<{ north: number; south: number; east: number; west: number } | null>(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        ...mapOptions,
        center,
        zoom,
        mapId: 'DOMIO_MAP_ID', // Map ID is required for advanced markers
      });
      
      setMap(newMap);

      // Initialize info window
      const newInfoWindow = new google.maps.InfoWindow({
        disableAutoPan: true, // Disable auto-pan animation
        pixelOffset: new google.maps.Size(0, -10), // Position closer to the marker
        ariaLabel: 'Szczegóły ogłoszenia',
      });
      setInfoWindow(newInfoWindow);

      // Disable all Google Maps InfoWindow animations with CSS
      const style = document.createElement('style');
      style.textContent = `
        .gm-style-iw-c {
          transition: none !important;
          animation: none !important;
        }
        .gm-style-iw-tc {
          transition: none !important;
          animation: none !important;
        }
        .gm-style-iw {
          transition: none !important;
          animation: none !important;
        }
        .gm-style-iw-d {
          transition: none !important;
          animation: none !important;
        }
        .gm-style-iw-ch {
          transition: none !important;
          animation: none !important;
        }
      `;
      if (!document.querySelector('#gm-infowindow-no-animation')) {
        style.id = 'gm-infowindow-no-animation';
        document.head.appendChild(style);
      }

      // Add click listener to close infoWindow when clicking on map
      newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
        // Close infoWindow when clicking on the map (not on markers)
        newInfoWindow.close();
        
        // Call the optional onMapClick callback if provided
        if (onMapClick) {
          onMapClick(event);
        }
      });

      // Add bounds_changed listener with debouncing
      if (onBoundsChanged) {
        newMap.addListener('bounds_changed', () => {
          // Clear existing debounce timeout
          if (boundsDebounceRef.current) {
            clearTimeout(boundsDebounceRef.current);
          }

          // Debounce the bounds change callback (300ms)
          boundsDebounceRef.current = setTimeout(() => {
            const bounds = newMap.getBounds();
            if (bounds) {
              const northEast = bounds.getNorthEast();
              const southWest = bounds.getSouthWest();
              
              const newBounds = {
                north: northEast.lat(),
                south: southWest.lat(),
                east: northEast.lng(),
                west: southWest.lng(),
              };

              // Only trigger callback if bounds changed significantly (>1% difference)
              const hasSignificantChange = !lastBoundsRef.current || 
                Math.abs(newBounds.north - lastBoundsRef.current.north) > (newBounds.north - newBounds.south) * 0.01 ||
                Math.abs(newBounds.south - lastBoundsRef.current.south) > (newBounds.north - newBounds.south) * 0.01 ||
                Math.abs(newBounds.east - lastBoundsRef.current.east) > (newBounds.east - newBounds.west) * 0.01 ||
                Math.abs(newBounds.west - lastBoundsRef.current.west) > (newBounds.east - newBounds.west) * 0.01;

              if (hasSignificantChange) {
                lastBoundsRef.current = newBounds;
                onBoundsChanged(newBounds);
              }
            }
          }, 300);
        });

        // Trigger initial bounds callback after map is ready
        const idleListener = newMap.addListener('idle', () => {
          const bounds = newMap.getBounds();
          if (bounds && onBoundsChanged) {
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();
            
            const initialBounds = {
              north: northEast.lat(),
              south: southWest.lat(),
              east: northEast.lng(),
              west: southWest.lng(),
            };
            
            lastBoundsRef.current = initialBounds;
            onBoundsChanged(initialBounds);
            google.maps.event.removeListener(idleListener);
          }
        });
      }
    }
  }, [mapRef, map, center, zoom, onMapClick, onBoundsChanged]);

  // Update map center and zoom when props change
  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !infoWindow) return;

    // Clear existing markers
    mapMarkersRef.current.forEach(marker => marker.map = null);

    // Create new advanced markers
    const newMarkers = markers.map(markerData => {
      // Determine color scheme based on marker type
      const colorScheme = markerData.isUrgent 
        ? markerColors.urgent
        : markerData.isSelected 
          ? markerColors.selected
          : markerColors.default;

      // Create a custom pin element with color based on marker type
      const pinElement = new google.maps.marker.PinElement({
        background: colorScheme.background,
        borderColor: colorScheme.borderColor,
        glyphColor: colorScheme.glyphColor,
        scale: markerData.isSelected ? 1.2 : 1,
      });

      // Set zIndex based on hover state
        if (markerData.isHovered) {
          pinElement.element.style.zIndex = '1001';
        } else {
          pinElement.element.style.zIndex = '100';
        }

      // Add data attribute to track marker ID
      pinElement.element.setAttribute('data-marker-id', markerData.id);

      // Create the advanced marker
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: markerData.position,
        map,
        title: markerData.title,
        content: pinElement.element,
        zIndex: markerData.isSelected ? 1000 : markerData.isHovered ? 1001 : 100,
      });

      // Marker click opens info window (doesn't navigate)
      if (infoWindow && markerData.jobData) {
        marker.addListener('click', () => {
          // Clear any pending close timeout
          if (infoWindowTimeoutRef.current) {
            clearTimeout(infoWindowTimeoutRef.current);
            infoWindowTimeoutRef.current = null;
          }

          // Increase zIndex on click
          pinElement.element.style.zIndex = '1001';

          const content = generateInfoWindowContent(markerData.jobData, isSmallMap);
          infoWindow.setContent(content);
          infoWindow.open(map, marker);

          // Add click listener and hover listeners to info window content after it's rendered
          setTimeout(() => {
            const infoWindowElement = document.querySelector(`[data-job-id="${markerData.id}"]`);
            if (infoWindowElement) {
              // Click handler - only info window click navigates
              infoWindowElement.addEventListener('click', () => {
                if (markerData.onClick) {
                  markerData.onClick();
                }
              });

              // Keep info window open when hovering over it
              infoWindowElement.addEventListener('mouseenter', () => {
                isHoveringInfoWindowRef.current = true;
                if (infoWindowTimeoutRef.current) {
                  clearTimeout(infoWindowTimeoutRef.current);
                  infoWindowTimeoutRef.current = null;
                }
              });

              infoWindowElement.addEventListener('mouseleave', () => {
                isHoveringInfoWindowRef.current = false;
                // Don't close - keep infoWindow open
              });
            }
          }, 100);
        });

        marker.addListener('mouseover', () => {
          // Clear any pending close timeout
          if (infoWindowTimeoutRef.current) {
            clearTimeout(infoWindowTimeoutRef.current);
            infoWindowTimeoutRef.current = null;
          }

          // Increase zIndex on hover
          pinElement.element.style.zIndex = '1001';

          const content = generateInfoWindowContent(markerData.jobData, isSmallMap);
          infoWindow.setContent(content);
          infoWindow.open(map, marker);

          // Add click listener and hover listeners to info window content after it's rendered
          setTimeout(() => {
            const infoWindowElement = document.querySelector(`[data-job-id="${markerData.id}"]`);
            if (infoWindowElement) {
              // Click handler - only info window click navigates
              infoWindowElement.addEventListener('click', () => {
                if (markerData.onClick) {
                  markerData.onClick();
                }
              });

              // Keep info window open when hovering over it
              infoWindowElement.addEventListener('mouseenter', () => {
                isHoveringInfoWindowRef.current = true;
                if (infoWindowTimeoutRef.current) {
                  clearTimeout(infoWindowTimeoutRef.current);
                  infoWindowTimeoutRef.current = null;
                }
              });

              infoWindowElement.addEventListener('mouseleave', () => {
                isHoveringInfoWindowRef.current = false;
                // Don't close - keep infoWindow open
              });
            }
          }, 100);
        });

        marker.addListener('mouseout', () => {
          // Reset zIndex when leaving
          pinElement.element.style.zIndex = '100';
          
          // Don't close - keep infoWindow open
        });
      }

      return marker;
    });

    setMapMarkers(newMarkers);
    mapMarkersRef.current = newMarkers;

    // Keep the map centered on the specified center instead of auto-fitting to markers
  }, [map, infoWindow, markers, onMarkerClick, isMapExpanded, isSmallMap]);

  // Handle programmatic hover state changes (from JobCard hover)
  useEffect(() => {
    if (!map || !infoWindow || mapMarkersRef.current.length === 0) return;

    // Find the hovered marker by checking the data attribute
    const hoveredMarker = mapMarkersRef.current.find(marker => {
      const markerId = (marker.content as HTMLElement)?.getAttribute('data-marker-id');
      const markerData = markers.find(m => m.id === markerId);
      return markerData?.isHovered;
    });

    if (hoveredMarker) {
      const markerId = (hoveredMarker.content as HTMLElement)?.getAttribute('data-marker-id');
      const markerData = markers.find(m => m.id === markerId);
      if (markerData && markerData.jobData) {
        // Clear any pending close timeout
        if (infoWindowTimeoutRef.current) {
          clearTimeout(infoWindowTimeoutRef.current);
          infoWindowTimeoutRef.current = null;
        }

        // Calculate offset position to make room for infoWindow above the marker
        // Convert 150 pixels to latitude degrees based on current zoom level
        const zoom = map.getZoom() || 12;
        const scale = Math.pow(2, zoom);
        const pixelsPerDegree = (256 * scale) / 360;
        const latOffset = 110 / pixelsPerDegree;

        // Pan to offset position in one smooth animation
        const offsetPosition = {
          lat: markerData.position.lat + latOffset,
          lng: markerData.position.lng
        };
        map.panTo(offsetPosition);

        const content = generateInfoWindowContent(markerData.jobData, isSmallMap);
        infoWindow.setContent(content);
        infoWindow.open(map, hoveredMarker);

        // Add click listener and hover listeners to info window content after it's rendered
        setTimeout(() => {
          const infoWindowElement = document.querySelector(`[data-job-id="${markerData.id}"]`);
          if (infoWindowElement) {
            // Click handler
            infoWindowElement.addEventListener('click', () => {
              if (markerData.onClick) {
                markerData.onClick();
              }
            });

            // Keep info window open when hovering over it
            infoWindowElement.addEventListener('mouseenter', () => {
              isHoveringInfoWindowRef.current = true;
              if (infoWindowTimeoutRef.current) {
                clearTimeout(infoWindowTimeoutRef.current);
                infoWindowTimeoutRef.current = null;
              }
            });

            infoWindowElement.addEventListener('mouseleave', () => {
              isHoveringInfoWindowRef.current = false;
              // Don't close - keep infoWindow open
            });
          }
        }, 100);
      }
    } else {
      // Don't close - keep infoWindow open
    }
  }, [map, infoWindow, markers, isMapExpanded, isSmallMap]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (infoWindowTimeoutRef.current) {
        clearTimeout(infoWindowTimeoutRef.current);
      }
      if (boundsDebounceRef.current) {
        clearTimeout(boundsDebounceRef.current);
      }
    };
  }, []);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

const LoadingComponent = () => (
  <div className="flex items-center justify-center h-full bg-muted">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-sm text-muted-foreground">Ładowanie mapy...</p>
    </div>
  </div>
);

const ErrorComponent = ({ status }: { status: Status }) => (
  <div className="flex items-center justify-center h-full bg-muted">
    <div className="text-center">
      <div className="text-red-500 mb-2">⚠️</div>
      <p className="text-sm text-muted-foreground">
        {status === Status.FAILURE 
          ? 'Nie można załadować mapy. Sprawdź klucz API.'
          : 'Ładowanie mapy...'
        }
      </p>
    </div>
  </div>
);

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  onClick?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
  isUrgent?: boolean;
  jobData?: Job;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  markers = [],
  center = { lat: 52.2297, lng: 21.0122 },
  zoom = 12,
  onMapClick,
  onMarkerClick,
  onBoundsChanged,
  className = '',
  style = { height: '100%' },
  isMapExpanded = false,
  isSmallMap = false
}) => {
  const render = useCallback((status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        return <ErrorComponent status={status} />;
      case Status.SUCCESS:
        return (
          <MapComponent
            markers={markers}
            center={center}
            zoom={zoom}
            onMapClick={onMapClick}
            onMarkerClick={onMarkerClick}
            onBoundsChanged={onBoundsChanged}
            isMapExpanded={isMapExpanded}
            isSmallMap={isSmallMap}
          />
        );
    }
  }, [markers, center, zoom, onMapClick, onMarkerClick, onBoundsChanged, isMapExpanded, isSmallMap]);

  if (!googleMapsConfig.apiKey || googleMapsConfig.apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="flex items-center justify-center h-full bg-muted border border-dashed border-border rounded-lg">
        <div className="text-center p-6 max-w-md">
          <div className="text-blue-500 mb-4 text-4xl">🗺️</div>
          <h3 className="font-medium mb-2">Mapa Google</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aby zobaczyć mapę, skonfiguruj klucz API Google Maps.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
            <p className="font-medium text-blue-800 mb-1">Instrukcja:</p>
            <ol className="text-blue-700 space-y-1 text-left">
              <li>1. Otwórz plik .env.local</li>
              <li>2. Dodaj swój klucz API Google Maps</li>
              <li>3. Uruchom ponownie serwer dev</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Zobacz GOOGLE_MAPS_SETUP.md aby uzyskać szczegółowe instrukcje.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Wrapper apiKey={googleMapsConfig.apiKey} libraries={googleMapsConfig.libraries as any} render={render} />
    </div>
  );
};

export default GoogleMap;
