import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Layers, Filter, List, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface MobileMapViewProps {
  onJobSelect: (jobId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  filters?: any;
}

// Mock map markers data
const mockMapJobs = [
  {
    id: '1',
    title: 'Remont łazienki w bloku z lat 80-tych',
    category: 'Remonty mieszkań',
    budget: '15000-25000',
    location: { lat: 52.2297, lng: 21.0122 },
    address: 'Warszawa, Mokotów',
    urgent: true,
    distance: 2.3
  },
  {
    id: '2', 
    title: 'Malowanie klatki schodowej - 4 piętra',
    category: 'Prace malarskie',
    budget: '8000-12000',
    location: { lat: 52.2419, lng: 21.0067 },
    address: 'Warszawa, Śródmieście',
    urgent: false,
    distance: 1.8
  },
  {
    id: '3',
    title: 'Wymiana windy - modernizacja',
    category: 'Instalacje techniczne', 
    budget: '80000-120000',
    location: { lat: 52.2163, lng: 21.0084 },
    address: 'Warszawa, Wilanów',
    urgent: false,
    distance: 5.2
  }
];

export const MobileMapView: React.FC<MobileMapViewProps> = ({
  onJobSelect,
  userLocation,
  onLocationChange,
  filters
}) => {
  const [selectedJob, setSelectedJob] = useState<typeof mockMapJobs[0] | null>(null);
  const [showJobsList, setShowJobsList] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 52.2297, lng: 21.0122 });
  const [zoom, setZoom] = useState(12);

  const formatBudget = (budget: string) => {
    const [min, max] = budget.split('-');
    return `${parseInt(min).toLocaleString()}-${parseInt(max).toLocaleString()} zł`;
  };

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(newLocation);
          onLocationChange?.(newLocation);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const handleMarkerClick = (job: typeof mockMapJobs[0]) => {
    setSelectedJob(job);
    setMapCenter(job.location);
  };

  const handleJobCardClick = (jobId: string) => {
    onJobSelect(jobId);
  };

  return (
    <div className="mobile-map-view relative h-full bg-muted">
      {/* Map Container - Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Mapa zleceń</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tutaj będzie interaktywna mapa z zaznaczonymi zleceniami
          </p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Funkcjonalności mapy:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="text-xs">Markery zleceń</Badge>
              <Badge variant="outline" className="text-xs">Geolokalizacja</Badge>
              <Badge variant="outline" className="text-xs">Clustering</Badge>
              <Badge variant="outline" className="text-xs">Filtry wizualne</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 space-y-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleGetLocation}
          className="shadow-lg"
        >
          <Navigation className="h-5 w-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="shadow-lg"
        >
          <Layers className="h-5 w-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="shadow-lg"
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-20 z-10">
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center">
              <Search className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground flex-1">
                Wyszukaj w tym obszarze...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Toggle Button */}
      <div className="absolute bottom-20 right-4 z-10">
        <Button
          onClick={() => setShowJobsList(!showJobsList)}
          className="shadow-lg"
        >
          <List className="h-5 w-5 mr-2" />
          Lista ({mockMapJobs.length})
        </Button>
      </div>

      {/* Selected Job Card */}
      {selectedJob && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedJob.urgent && (
                      <Badge variant="destructive" className="text-xs px-2 py-0">
                        Pilne
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {selectedJob.category}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm leading-tight mb-2">
                    {selectedJob.title}
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-success font-medium">
                      {formatBudget(selectedJob.budget)}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDistance(selectedJob.distance)}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleJobCardClick(selectedJob.id)}
                >
                  Zobacz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs List Overlay */}
      {showJobsList && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-20 max-h-96 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Zlecenia w tym obszarze</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJobsList(false)}
              >
                Zamknij
              </Button>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {mockMapJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  handleMarkerClick(job);
                  setShowJobsList(false);
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    {job.urgent && (
                      <Badge variant="destructive" className="text-xs px-2 py-0">
                        Pilne
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {job.category}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm leading-tight">
                    {job.title}
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{job.address}</span>
                    </div>
                    <div className="text-success font-medium">
                      {formatBudget(job.budget)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="text-xs text-muted-foreground">
              {mockMapJobs.length} zleceń w okolicy
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};