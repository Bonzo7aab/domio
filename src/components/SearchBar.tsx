import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, BookmarkIcon, Bell, History, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSavedSearchSelect?: (search: SavedSearch) => void;
  onFilterToggle?: () => void;
  filtersActive?: boolean;
  resultsCount?: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: any;
  createdAt: Date;
  notificationsEnabled: boolean;
}

interface SearchSuggestion {
  type: 'recent' | 'trending' | 'category' | 'location';
  text: string;
  count?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChange,
  onSavedSearchSelect,
  onFilterToggle,
  filtersActive = false,
  resultsCount = 0
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data for saved searches
  const [savedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'Sprzątanie Warszawa',
      query: 'sprzątanie',
      createdAt: new Date('2024-01-15'),
      notificationsEnabled: true
    },
    {
      id: '2', 
      name: 'Remonty elewacji',
      query: 'elewacja remont',
      createdAt: new Date('2024-01-10'),
      notificationsEnabled: false
    },
    {
      id: '3',
      name: 'Instalacje elektryczne',
      query: 'elektryk instalacja',
      createdAt: new Date('2024-01-08'),
      notificationsEnabled: true
    }
  ]);

  // Mock suggestions based on search trends
  const suggestions: SearchSuggestion[] = [
    { type: 'trending', text: 'sprzątanie klatek', count: 45 },
    { type: 'trending', text: 'remont elewacji', count: 32 },
    { type: 'trending', text: 'serwis instalacji', count: 28 },
    { type: 'category', text: 'utrzymanie czystości' },
    { type: 'category', text: 'roboty budowlane' },
    { type: 'location', text: 'Warszawa' },
    { type: 'location', text: 'Kraków' },
    { type: 'recent', text: 'deratyzacja pilne' },
    { type: 'recent', text: 'przegląd techniczny' }
  ];

  const recentSearches = [
    'sprzątanie warszawa',
    'elektryk kraków', 
    'remont dachu',
    'przegląd wind'
  ];

  const trendingSearches = suggestions.filter(s => s.type === 'trending');

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text && suggestion.text.toLowerCase().includes((value || '').toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange?.(suggestion);
    setShowSuggestions(false);
    setIsFocused(false);
  };

  const handleSavedSearchClick = (savedSearch: SavedSearch) => {
    onChange?.(savedSearch.query);
    onSavedSearchSelect?.(savedSearch);
    setShowSuggestions(false);
    setIsFocused(false);
  };

  const clearSearch = () => {
    onChange?.('');
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'recent':
        return <History className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Main Search Input */}
      <div className={`relative transition-all duration-200 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Szukaj zleceń: sprzątanie, remont, elektryk..."
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={handleInputFocus}
            className={`pl-10 pr-20 h-12 text-base border-2 transition-colors ${
              isFocused 
                ? 'border-primary shadow-lg' 
                : 'border-border hover:border-primary/50'
            }`}
          />
          
          {/* Clear and Filter buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant={filtersActive ? "default" : "ghost"}
              size="sm"
              onClick={onFilterToggle}
              className="h-8 px-3"
            >
              <Filter className="h-4 w-4" />
              {filtersActive && <span className="ml-1 text-xs">ON</span>}
            </Button>
          </div>
        </div>

        {/* Results count */}
        {value && (
          <div className="absolute right-0 -bottom-6 text-xs text-muted-foreground">
            {resultsCount > 0 ? `${resultsCount} wyników` : 'Brak wyników'}
          </div>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-xl border-2">
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {/* Saved Searches */}
            {savedSearches.length > 0 && !value && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm flex items-center">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Zapisane wyszukiwania
                  </h4>
                </div>
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      onClick={() => handleSavedSearchClick(search)}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{search.name}</span>
                        {search.notificationsEnabled && (
                          <Bell className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {search.query}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Recent Searches */}
            {!value && (
              <div className="p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center">
                  <History className="h-4 w-4 mr-2" />
                  Ostatnie wyszukiwania
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      onClick={() => handleSuggestionClick(search)}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Trending Searches */}
            {!value && (
              <div className="p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Popularne wyszukiwania
                </h4>
                <div className="space-y-2">
                  {trendingSearches.map((search, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(search.text)}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        {getSuggestionIcon(search.type)}
                        <span className="text-sm">{search.text}</span>
                      </div>
                      {search.count && (
                        <Badge variant="outline" className="text-xs">
                          {search.count}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            {value && filteredSuggestions.length > 0 && (
              <div className="p-4">
                <h4 className="font-medium text-sm mb-3">Sugestie</h4>
                <div className="space-y-1">
                  {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-sm">{suggestion.text}</span>
                      {suggestion.count && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {suggestion.count}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No suggestions */}
            {value && filteredSuggestions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak sugestii dla "{value}"</p>
                <p className="text-xs mt-1">Spróbuj innych słów kluczowych</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};