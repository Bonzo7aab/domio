import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Euro, Filter, TrendingUp, Star, Search } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

// Mock data - same structure as desktop version
const mockJobs = [
  {
    id: '1',
    title: 'Remont łazienki w bloku z lat 80-tych',
    category: 'Remonty mieszkań',
    budget: '15000-25000',
    location: 'Warszawa, Mokotów',
    distance: 2.3,
    postedTime: '2 godz. temu',
    company: 'WSM Mokotów',
    urgent: true,
    applicants: 12,
    rating: 4.8,
    description: 'Kompleksowy remont łazienki około 6m²...',
    tags: ['Hydraulika', 'Glazura', 'Elektryka']
  },
  {
    id: '2',
    title: 'Malowanie klatki schodowej - 4 piętra',
    category: 'Prace malarskie',
    budget: '8000-12000',
    location: 'Kraków, Nowa Huta',
    distance: 1.8,
    postedTime: '4 godz. temu',
    company: 'Spółdzielnia Mieszkaniowa "Kombatantów"',
    urgent: false,
    applicants: 8,
    rating: 4.6,
    description: 'Malowanie i gruntowanie klatki schodowej...',
    tags: ['Malowanie', 'Gruntowanie']
  },
  {
    id: '3',
    title: 'Wymiana windowy - modernizacja',
    category: 'Instalacje techniczne',
    budget: '80000-120000',
    location: 'Gdańsk, Śródmieście',
    distance: 5.2,
    postedTime: '1 dzień temu',
    company: 'Zarząd Nieruchomości Gdańsk',
    urgent: false,
    applicants: 3,
    rating: 4.9,
    description: 'Kompleksowa wymiana windy osobowej...',
    tags: ['Windy', 'Modernizacja', 'Certyfikaty']
  }
];

interface MobileJobListProps {
  onJobSelect: (jobId: string) => void;
  onSearchFocus: () => void;
  onFiltersClick: () => void;
  filters: any;
  userLocation?: { lat: number; lng: number } | null;
}

export const MobileJobList: React.FC<MobileJobListProps> = ({
  onJobSelect,
  onSearchFocus,
  onFiltersClick,
  filters,
  userLocation
}) => {
  const [jobs, setJobs] = useState(mockJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'distance' | 'budget'>('newest');

  // Quick filters
  const quickFilters = [
    { id: 'all', label: 'Wszystkie', active: true },
    { id: 'urgent', label: 'Pilne', active: false },
    { id: 'nearby', label: 'W pobliżu', active: false },
    { id: 'high-budget', label: 'Wysoki budżet', active: false }
  ];

  const [activeQuickFilters, setActiveQuickFilters] = useState(quickFilters);

  const formatBudget = (budget: string) => {
    const [min, max] = budget.split('-');
    return `${parseInt(min).toLocaleString()}-${parseInt(max).toLocaleString()} zł`;
  };

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const handleQuickFilterToggle = (filterId: string) => {
    setActiveQuickFilters(prev => 
      prev.map(filter => ({
        ...filter,
        active: filter.id === filterId ? !filter.active : filter.id === 'all' ? false : filter.active
      }))
    );
  };

  const handleSortChange = (newSort: 'newest' | 'distance' | 'budget') => {
    setSortBy(newSort);
    // Here you would typically sort the jobs array
  };

  const JobCard: React.FC<{ job: typeof mockJobs[0] }> = ({ job }) => (
    <Card 
      className="mx-4 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => onJobSelect(job.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
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
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {job.company}
            </p>
          </div>
          <div className="flex items-center text-warning">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm ml-1">{job.rating}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-success">
              <Euro className="h-4 w-4 mr-1" />
              <span className="font-medium">{formatBudget(job.budget)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{formatDistance(job.distance)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{job.postedTime}</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{job.applicants} aplikacji</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-2">
            {job.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{job.tags.length - 3}</span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {job.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const LoadingSkeleton: React.FC = () => (
    <Card className="mx-4 mb-3">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-18" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mobile-job-list flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-4 py-3 bg-muted/30">
        <div 
          className="flex items-center bg-white rounded-lg border px-3 py-2 cursor-pointer"
          onClick={onSearchFocus}
        >
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <span className="text-muted-foreground flex-1">Szukaj zleceń...</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onFiltersClick();
            }}
            className="p-1"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {activeQuickFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilterToggle(filter.id)}
              className="whitespace-nowrap text-sm"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="px-4 py-2 border-b">
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'newest' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSortChange('newest')}
            className="text-sm"
          >
            Najnowsze
          </Button>
          <Button
            variant={sortBy === 'distance' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSortChange('distance')}
            className="text-sm"
          >
            Najbliższe
          </Button>
          <Button
            variant={sortBy === 'budget' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSortChange('budget')}
            className="text-sm"
          >
            Budżet
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          // Loading skeletons
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : (
          <>
            <div className="py-2">
              <div className="px-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Znaleziono {jobs.length} zleceń w Twojej okolicy
                </p>
              </div>
              
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            
            {/* Load More */}
            <div className="px-4 py-4">
              <Button variant="outline" className="w-full" onClick={() => setIsLoading(true)}>
                Załaduj więcej zleceń
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};