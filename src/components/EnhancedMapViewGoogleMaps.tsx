'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Crosshair, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import GoogleMap, { MapMarker } from './GoogleMap';
import { geocodeAddress, getCurrentLocation, calculateDistance } from '../lib/google-maps/geocoding';
import { Job } from '../types/job';
import { MapLegend } from './MapLegend';
import JobFilters, { FilterState } from './JobFilters';

interface EnhancedMapViewProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  jobs?: Job[];
  selectedJobId?: string | null;
  onJobSelect?: (jobId: string) => void;
  hoveredJobId?: string | null;
  onJobHover?: (jobId: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  onCityNameChange?: (cityName: string | null) => void;
  searchRadius?: number;
  onRadiusChange?: (radius: number) => void;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  showCitySelector?: boolean;
  onCitySelectorClose?: () => void;
  onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

// Real coordinates for Polish cities
const cityCoordinates = {
  'Warszawa': { lat: 52.2297, lng: 21.0122 },
  'Kraków': { lat: 50.0647, lng: 19.9450 },
  'Gdańsk': { lat: 54.3520, lng: 18.6466 },
  'Wrocław': { lat: 51.1079, lng: 17.0385 },
  'Poznań': { lat: 52.4064, lng: 16.9252 },
  'Katowice': { lat: 50.2649, lng: 19.0238 },
  'Łódź': { lat: 51.7592, lng: 19.4560 },
  'Lublin': { lat: 51.2465, lng: 22.5684 },
  'Białystok': { lat: 53.1325, lng: 23.1688 },
  'Szczecin': { lat: 53.4285, lng: 14.5528 }
};

export const EnhancedMapViewGoogleMaps: React.FC<EnhancedMapViewProps> = ({
  isExpanded = false,
  onToggleExpand,
  jobs = [],
  selectedJobId,
  onJobSelect,
  hoveredJobId,
  onJobHover,
  userLocation,
  onLocationChange,
  onCityNameChange,
  searchRadius = 25,
  onRadiusChange,
  filters,
  onFiltersChange,
  showCitySelector: externalShowCitySelector = false,
  onCitySelectorClose,
  onBoundsChanged
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showJobClusters] = useState(true); // Always show all jobs
  const [mapCenter, setMapCenter] = useState({ lat: 52.1394, lng: 21.0458 }); // Ursynów, Warsaw
  const [mapZoom, setMapZoom] = useState(13); // District-level view
  const [showMapFilters, setShowMapFilters] = useState(true);
  const [showMapLegend, setShowMapLegend] = useState(true);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);

  // Function to find city name from coordinates
  const findCityNameFromCoordinates = (lat: number, lng: number): string | null => {
    // Simple distance-based city detection
    for (const [cityName, coords] of Object.entries(cityCoordinates)) {
      const distance = Math.sqrt(
        Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2)
      );
      if (distance < 0.5) { // Within ~50km radius
        return cityName;
      }
    }
    return null;
  };

  // Initialize map center based on user location or default to Warsaw
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation);
      // Try to find the city name for the user's location
      const cityName = findCityNameFromCoordinates(userLocation.lat, userLocation.lng);
      if (cityName) {
        setSelectedCityName(cityName);
        onCityNameChange?.(cityName);
      }
    }
  }, [userLocation, onCityNameChange]);

  // Handle external showCitySelector prop
  useEffect(() => {
    if (externalShowCitySelector) {
      setShowCitySelector(true);
    }
  }, [externalShowCitySelector]);

  // Get user location or show city selector
  const getUserLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const location = await getCurrentLocation();
      onLocationChange?.(location);
      setMapCenter(location);
      setMapZoom(15);
      
      // Try to find the city name for the user's location
      const cityName = findCityNameFromCoordinates(location.lat, location.lng);
      if (cityName) {
        setSelectedCityName(cityName);
        onCityNameChange?.(cityName);
      }
      
      setIsGettingLocation(false);
    } catch (error) {
      setIsGettingLocation(false);
      
      toast.info('Wybierz miasto', {
        description: 'Nie można automatycznie wykryć Twojej lokalizacji. Wybierz miasto z listy.',
        action: {
          label: 'Wybierz',
          onClick: () => setShowCitySelector(true)
        }
      });
      
      setShowCitySelector(true);
    }
  };

  // Handle city selection
  const handleCitySelect = (cityName: string) => {
    const coordinates = cityCoordinates[cityName as keyof typeof cityCoordinates];
    if (coordinates) {
      setSelectedCityName(cityName);
      onCityNameChange?.(cityName);
      onLocationChange?.(coordinates);
      setMapCenter(coordinates);
      setMapZoom(12);
      setShowCitySelector(false);
      onCitySelectorClose?.();
    }
  };

  // Filter jobs by radius if user location is available
  const filteredJobs = useMemo(() => {
    if (!userLocation || !showJobClusters) return jobs;
    
    return jobs.filter(job => {
      const distance = calculateDistance(userLocation.lat, userLocation.lng, job.lat, job.lng);
      return distance <= searchRadius;
    });
  }, [jobs, userLocation, searchRadius, showJobClusters]);

  // Apply map filters (always apply filters, not just when expanded)
  const filteredByMapFilters = useMemo(() => {
    if (!filters) return filteredJobs;
    
    
    const result = filteredJobs.filter(job => {
      // Filter by post type (job vs tender)
      if (filters.postTypes && filters.postTypes.length > 0) {
        const jobPostType = job.postType || 'job';
        if (filters.postTypes.length === 2 && filters.postTypes.includes('job') && filters.postTypes.includes('tender')) {
          // Show all posts
        } else if (!filters.postTypes.includes(jobPostType)) {
          return false;
        }
      }
      
      // Filter by category
      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(job.category)) {
        return false;
      }
      
      // Filter by subcategories
      if (filters.subcategories && filters.subcategories.length > 0 && !filters.subcategories.includes(job.subcategory)) {
        return false;
      }
      
      // Filter by contract types
      if (filters.contractTypes && filters.contractTypes.length > 0 && !filters.contractTypes.includes(job.type)) {
        return false;
      }
      
      // Filter by locations
      if (filters.locations && filters.locations.length > 0 && !filters.locations.includes(job.location)) {
        return false;
      }
      
      // Filter by client types
      if (filters.clientTypes && filters.clientTypes.length > 0 && !filters.clientTypes.includes(job.clientType)) {
        return false;
      }
      
      // Filter by salary range
      const jobSalary = (job as any).salaryMin || 0;
      if (jobSalary < filters.salaryRange[0] || jobSalary > filters.salaryRange[1]) {
        return false;
      }
      
      
      // Filter by search query
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = [
          job.title,
          job.company,
          job.location,
          job.description,
          job.category,
          job.subcategory
        ].join(' ').toLowerCase();
        
        if (!searchText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
    
    return result;
  }, [filteredJobs, filters]);

  // Convert jobs to map markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    // Always use filteredByMapFilters to ensure consistent filtering with job list
    const jobsToShow = filteredByMapFilters;
    
    return jobsToShow.map(job => ({
      id: job.id,
      position: { lat: job.lat, lng: job.lng },
      title: job.title,
      onClick: () => onJobSelect?.(job.id),
      isSelected: selectedJobId === job.id,
      isHovered: hoveredJobId === job.id,
      isUrgent: job.urgent,
      jobData: job,
    }));
  }, [filteredByMapFilters, selectedJobId, hoveredJobId, onJobSelect]);

  // Handle map clicks
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    // Map click handler - can be used for future functionality
  };

  // Handle marker clicks
  const handleMarkerClick = (markerId: string) => {
    onJobSelect?.(markerId);
  };

  return (
    <div className={`relative transition-all duration-300 flex-shrink-0 ${
      isExpanded ? 'fixed top-0 left-0 right-0 bottom-0 z-50 w-full h-[calc(100vh-4rem)]' : 'w-[450px] h-[450px]'
    }`}>
      {/* Map Container */}
      <div className={`relative w-full h-full overflow-hidden bg-muted ${
        isExpanded ? 'rounded-none border-none' : 'rounded-lg border border-border'
      }`}>
        <GoogleMap
          markers={mapMarkers}
          center={mapCenter}
          zoom={mapZoom}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          onBoundsChanged={onBoundsChanged}
          className="w-full h-full"
          isMapExpanded={isExpanded}
          isSmallMap={!isExpanded}
        />

        {/* Expand/Collapse Button */}
        {onToggleExpand && (
          <div className={`absolute z-[1001] ${isExpanded ? 'top-4 right-4' : 'top-4 right-4'}`}>
            <Button
              variant="outline"
              size={isExpanded ? "default" : "icon"}
              onClick={onToggleExpand}
              className={`bg-white shadow-lg ${isExpanded ? 'h-10 px-4' : 'w-10 h-10'}`}
              title={isExpanded ? 'Zmniejsz mapę' : 'Powiększ mapę'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Zmniejsz mapę
                </>
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        {/* Map Filters - Only visible when expanded and on desktop */}
        {isExpanded && showMapFilters && onFiltersChange && (
          <div className="absolute top-20 left-4 z-[1001] w-80 hidden md:block">
            <JobFilters 
              onFilterChange={onFiltersChange}
              primaryLocation={selectedCityName || undefined}
            />
          </div>
        )}

        {/* Map Legend - Only visible when expanded */}
        {isExpanded && showMapLegend && (
          <div className="absolute bottom-8 right-16 z-[1000]">
            <MapLegend />
          </div>
        )}


        {/* Location Button */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Button
            variant="outline"
            size="icon"
            onClick={getUserLocation}
            disabled={isGettingLocation}
            className="w-10 h-10 bg-white shadow-lg"
            title="Użyj mojej lokalizacji"
          >
            <Crosshair className={`w-4 h-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* City Selector Modal */}
        {showCitySelector && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
            <Card className="w-96 max-w-[90vw]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wybierz swoje miasto</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCitySelector(false);
                      // Set default to Warsaw
                      const defaultLocation = { lat: 52.2297, lng: 21.0122 };
                      const defaultCityName = 'Warszawa';
                      setSelectedCityName(defaultCityName);
                      onCityNameChange?.(defaultCityName);
                      onLocationChange?.(defaultLocation);
                      setMapCenter(defaultLocation);
                      setMapZoom(12);
                      onCitySelectorClose?.();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nie można automatycznie wykryć Twojej lokalizacji. Wybierz miasto, aby zobaczyć zlecenia w pobliżu.
                </p>
                <Select onValueChange={handleCitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz miasto" />
                  </SelectTrigger>
                  <SelectContent className="z-[3000]">
                    {Object.keys(cityCoordinates).map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

export default EnhancedMapViewGoogleMaps;
