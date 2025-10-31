import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, X, Clock, TrendingUp, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface MobileSearchProps {
  onBack: () => void;
  onJobSelect: (jobId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const recentSearches = [
  'remont łazienki',
  'malowanie',
  'instalacja elektryczna',
  'plomba'
];

const popularSearches = [
  'hydraulik Warszawa',
  'remont mieszkania',
  'wymiana okien',
  'ocieplenie budynku',
  'naprawa windy'
];

const mockSearchResults = [
  {
    id: '1',
    title: 'Remont łazienki w bloku z lat 80-tych',
    category: 'Remonty mieszkań',
    location: 'Warszawa, Mokotów',
    budget: '15000-25000',
    distance: 2.3,
    urgent: true
  },
  {
    id: '2',
    title: 'Malowanie klatki schodowej - 4 piętra',
    category: 'Prace malarskie',
    location: 'Kraków, Nowa Huta',
    budget: '8000-12000',
    distance: 15.8,
    urgent: false
  }
];

export const MobileSearch: React.FC<MobileSearchProps> = ({
  onBack,
  onJobSelect,
  searchQuery,
  onSearchChange
}) => {
  const [query, setQuery] = useState(searchQuery);
  const [results, setResults] = useState<typeof mockSearchResults>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus search input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Simulate search with debounce
    if (query.length > 0) {
      setIsLoading(true);
      const timeout = setTimeout(() => {
        setResults(mockSearchResults.filter(job => 
          job.title.toLowerCase().includes(query.toLowerCase()) ||
          job.category.toLowerCase().includes(query.toLowerCase())
        ));
        setIsLoading(false);
        setShowResults(true);
      }, 500);

      return () => clearTimeout(timeout);
    } else {
      setResults([]);
      setShowResults(false);
      setIsLoading(false);
    }
  }, [query]);

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    onSearchChange(searchTerm);
  };

  const handleClearSearch = () => {
    setQuery('');
    onSearchChange('');
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatBudget = (budget: string) => {
    const [min, max] = budget.split('-');
    return `${parseInt(min).toLocaleString()}-${parseInt(max).toLocaleString()} zł`;
  };

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <div className="mobile-search flex flex-col h-full bg-background">
      {/* Header with Search */}
      <div className="sticky top-0 z-50 bg-white border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Szukaj zleceń..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showResults ? (
          // Search Results
          <div className="p-4">
            <div className="mb-4">
              <h3 className="font-medium mb-2">
                Wyniki wyszukiwania {query && `dla "${query}"`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Znaleziono {results.length} {results.length === 1 ? 'zlecenie' : 'zleceń'}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-muted rounded w-20"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((job) => (
                  <Card 
                    key={job.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onJobSelect(job.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
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
                            <h4 className="font-medium text-sm leading-tight line-clamp-2">
                              {job.title}
                            </h4>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{job.location}</span>
                          </div>
                          <span>{formatDistance(job.distance)}</span>
                        </div>
                        
                        <div className="text-sm font-medium text-success">
                          {formatBudget(job.budget)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Brak wyników</h3>
                <p className="text-sm text-muted-foreground">
                  Spróbuj użyć innych słów kluczowych
                </p>
              </div>
            )}
          </div>
        ) : (
          // Search Suggestions
          <div className="p-4 space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="font-medium">Ostatnie wyszukiwania</h3>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <Card 
                      key={index}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSearch(search)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{search}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Remove from recent searches
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div>
              <div className="flex items-center mb-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="font-medium">Popularne wyszukiwania</h3>
              </div>
              <div className="space-y-2">
                {popularSearches.map((search, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSearch(search)}
                  >
                    <CardContent className="p-3">
                      <span className="text-sm">{search}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Search Tips */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">💡 Wskazówki wyszukiwania</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Użyj konkretnych słów kluczowych</li>
                  <li>• Dodaj nazwę miasta dla lepszych wyników</li>
                  <li>• Spróbuj synonimów lub podobnych terminów</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};