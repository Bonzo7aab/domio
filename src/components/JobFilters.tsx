import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Gavel, Wrench, Check, X, Edit3, ChevronDown as ArrowDown, AlertCircle, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { extractCity, extractSublocality, getProvinceForCity, getProvincesFromCities, type LocationData } from '../utils/locationMapping';
import type { Job } from '../types/job';

export interface FilterState {
  categories: string[];
  subcategories: string[];
  contractTypes: string[];
  locations: string[];
  cities: string[];
  sublocalities: string[]; // Format: "city:sublocality" e.g., "Warszawa:Ursynów"
  provinces: string[];
  budgetRanges: string[]; // ['<5000', '5000-20000', '20000+']
  budgetMin?: number;
  budgetMax?: number;
  clientTypes: string[];
  postTypes: string[]; // Zlecenia vs Przetargi
  urgency: string[]; // ['low', 'medium', 'high']
  urgent?: boolean; // High priority jobs (urgent flag)
  searchQuery?: string; // Search by title
  endingSoon?: boolean; // Tenders ending in less than 7 days
  dateAdded: string[]; // ['today', 'last-week', 'last-month', 'last-3-months', 'last-6-months', 'last-year']
}

interface JobFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
  primaryLocation?: string;
  onLocationChange?: () => void;
  jobs?: Job[]; // Available jobs to calculate dynamic categories/subcategories
  initialFilters?: FilterState; // Initial filters from parent
  isMapView?: boolean; // If true, applies map-specific padding adjustments
}

// Custom Checkbox Component to match the image styling
const CustomCheckbox: React.FC<{
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ id, checked, onCheckedChange }) => {
  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className={`w-4 h-4 border rounded cursor-pointer flex items-center justify-center ${
          checked 
            ? 'bg-blue-800 border-blue-800' 
            : 'bg-white border-gray-300 hover:border-gray-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </label>
    </div>
  );
};


export default function JobFilters({ onFilterChange, primaryLocation, onLocationChange, jobs = [], initialFilters, isMapView = false }: JobFiltersProps) {
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>(['post-type', 'search']);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSublocalities, setSelectedSublocalities] = useState<string[]>([]); // Format: "city:sublocality"
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>([]);
  const [selectedPostTypes, setSelectedPostTypes] = useState<string[]>(['job', 'tender']);
  const [selectedUrgency, setSelectedUrgency] = useState<string[]>([]);
  const [selectedBudgetRanges, setSelectedBudgetRanges] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [endingSoon, setEndingSoon] = useState(false);
  const [selectedDateAdded, setSelectedDateAdded] = useState<string[]>([]);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromSelfRef = useRef(false);

  // Sync local state with incoming filters (from quick filters or URL)
  useEffect(() => {
    if (initialFilters && !isUpdatingFromSelfRef.current) {
      if (initialFilters.categories !== undefined) setSelectedCategories(initialFilters.categories);
      if (initialFilters.subcategories !== undefined) setSelectedSubcategories(initialFilters.subcategories);
      if (initialFilters.contractTypes !== undefined) setSelectedContractTypes(initialFilters.contractTypes);
      if (initialFilters.cities !== undefined) setSelectedCities(initialFilters.cities);
      if (initialFilters.sublocalities !== undefined) setSelectedSublocalities(initialFilters.sublocalities);
      if (initialFilters.provinces !== undefined) setSelectedProvinces(initialFilters.provinces);
      if (initialFilters.clientTypes !== undefined) setSelectedClientTypes(initialFilters.clientTypes);
      if (initialFilters.postTypes !== undefined) setSelectedPostTypes(initialFilters.postTypes);
      if (initialFilters.urgency !== undefined) setSelectedUrgency(initialFilters.urgency);
      if (initialFilters.budgetRanges !== undefined) setSelectedBudgetRanges(initialFilters.budgetRanges);
      if (initialFilters.budgetMin !== undefined) setBudgetMin(initialFilters.budgetMin.toString());
      if (initialFilters.budgetMax !== undefined) setBudgetMax(initialFilters.budgetMax.toString());
      if (initialFilters.searchQuery !== undefined) setSearchQuery(initialFilters.searchQuery);
      if (initialFilters.endingSoon !== undefined) setEndingSoon(initialFilters.endingSoon);
      if (initialFilters.dateAdded !== undefined) setSelectedDateAdded(initialFilters.dateAdded);
    }
    // Reset the flag after syncing
    isUpdatingFromSelfRef.current = false;
  }, [initialFilters]);

  // Calculate categories dynamically from jobs (using category.name)
  const categories = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Group jobs by category name
    const categoryMap = new Map<string, number>();

    jobs.forEach(job => {
      // Handle category as either string or object with name property
      const categoryName = typeof job.category === 'string' 
        ? job.category 
        : (job.category?.name || 'Inne');
      const currentCount = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentCount + 1);
    });

    // Convert to array format sorted by count
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [jobs]);

  // Extract unique cities and their sublocalities from jobs
  const citiesWithSublocalities = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return new Map<string, Set<string>>();
    }

    const citySublocalityMap = new Map<string, Set<string>>();
    
    jobs.forEach(job => {
      if (job.location) {
        const city = extractCity(job.location);
        const sublocality = extractSublocality(job.location);
        
        if (city) {
          if (!citySublocalityMap.has(city)) {
            citySublocalityMap.set(city, new Set<string>());
          }
          
          if (sublocality) {
            citySublocalityMap.get(city)!.add(sublocality);
          }
        }
      }
    });

    return citySublocalityMap;
  }, [jobs]);

  // Get sorted list of cities
  const cities = useMemo(() => {
    return Array.from(citiesWithSublocalities.keys()).sort();
  }, [citiesWithSublocalities]);

  // Get sublocalities for a specific city
  const getSublocalitiesForCity = (city: string): string[] => {
    const sublocalities = citiesWithSublocalities.get(city);
    return sublocalities ? Array.from(sublocalities).sort() : [];
  };

  // Get available provinces based on selected cities
  const availableProvinces = useMemo(() => {
    if (selectedCities.length === 0) {
      return [];
    }
    return getProvincesFromCities(selectedCities);
  }, [selectedCities]);

  // Calculate client type counts from jobs
  const clientTypeCounts = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return {};
    }

    const counts: Record<string, number> = {};
    const clientTypes = ['Wspólnota Mieszkaniowa', 'Spółdzielnia Mieszkaniowa'];
    
    // Initialize counts for all client types
    clientTypes.forEach(type => {
      counts[type] = 0;
    });

    // Count jobs for each client type
    jobs.forEach(job => {
      if (job.clientType && clientTypes.includes(job.clientType)) {
        counts[job.clientType]++;
      }
    });

    return counts;
  }, [jobs]);

  // Emit filter changes to parent
  useEffect(() => {
    if (onFilterChange) {
      isUpdatingFromSelfRef.current = true;
      const budgetMinNum = budgetMin && budgetMin.trim() ? parseFloat(budgetMin) : undefined;
      const budgetMaxNum = budgetMax && budgetMax.trim() ? parseFloat(budgetMax) : undefined;
      
      onFilterChange({
        categories: selectedCategories,
        subcategories: selectedSubcategories,
        contractTypes: selectedContractTypes,
        locations: [], // Keep for backward compatibility, but use cities/provinces
        cities: selectedCities,
        sublocalities: selectedSublocalities,
        provinces: selectedProvinces,
        budgetRanges: selectedBudgetRanges,
        budgetMin: budgetMinNum !== undefined && !isNaN(budgetMinNum) ? budgetMinNum : undefined,
        budgetMax: budgetMaxNum !== undefined && !isNaN(budgetMaxNum) ? budgetMaxNum : undefined,
        clientTypes: selectedClientTypes,
        postTypes: selectedPostTypes,
        urgency: selectedUrgency,
        searchQuery,
        endingSoon: endingSoon,
        dateAdded: selectedDateAdded
      });
    }
  }, [selectedCategories, selectedSubcategories, selectedContractTypes, selectedCities, selectedSublocalities, selectedProvinces, selectedClientTypes, selectedPostTypes, selectedUrgency, selectedBudgetRanges, budgetMin, budgetMax, searchQuery, endingSoon, selectedDateAdded, onFilterChange]);

  // Scroll detection for showing scroll indicator
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isScrollable = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      
      setShowScrollIndicator(isScrollable && !isAtBottom);
    };

    // Check initial state
    checkScrollPosition();

    // Add scroll listener
    scrollContainer.addEventListener('scroll', checkScrollPosition);
    
    // Check on resize
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      scrollContainer.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [expandedFilterSections]); // Re-check when sections expand/collapse

  const toggleFilterSection = (sectionName: string) => {
    // Don't allow closing search section
    if (sectionName === 'search') return;
    
    setExpandedFilterSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  // Handle city selection - update provinces when cities change
  const handleCityChange = (city: string, checked: boolean) => {
    if (checked) {
      setSelectedCities(prev => [...prev, city]);
    } else {
      setSelectedCities(prev => prev.filter(c => c !== city));
      // Remove sublocalities for this city when city is deselected
      setSelectedSublocalities(prev => prev.filter(s => !s.startsWith(`${city}:`)));
      // Remove provinces that are no longer relevant
      const removedCityProvince = getProvinceForCity(city);
      if (removedCityProvince) {
        const remainingCities = selectedCities.filter(c => c !== city);
        const remainingProvinces = getProvincesFromCities(remainingCities);
        setSelectedProvinces(prev => prev.filter(p => remainingProvinces.includes(p)));
      }
    }
  };

  // Handle sublocality selection
  const handleSublocalityChange = (city: string, sublocality: string, checked: boolean) => {
    const sublocalityKey = `${city}:${sublocality}`;
    if (checked) {
      setSelectedSublocalities(prev => [...prev, sublocalityKey]);
      // Ensure city is also selected
      if (!selectedCities.includes(city)) {
        setSelectedCities(prev => [...prev, city]);
      }
    } else {
      setSelectedSublocalities(prev => prev.filter(s => s !== sublocalityKey));
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedContractTypes([]);
    setSelectedCities([]);
    setSelectedSublocalities([]);
    setSelectedProvinces([]);
    setSelectedClientTypes([]);
    setSelectedPostTypes(['job', 'tender']); // Domyślnie pokazuj wszystkie typy
    setSelectedUrgency([]);
    setSelectedBudgetRanges([]);
    setBudgetMin('');
    setBudgetMax('');
    setSearchQuery('');
    setEndingSoon(false);
    setSelectedDateAdded([]);
  };

  // Get all applied filters
  const getAppliedFilters = () => {
    const applied: Array<{ label: string; value: string; onRemove: () => void }> = [];

    // Post types - always show when selected
    selectedPostTypes.forEach(type => {
      applied.push({
        label: type === 'job' ? 'Zlecenia' : 'Przetargi',
        value: `postType-${type}`,
        onRemove: () => {
          setSelectedPostTypes(prev => {
            const newPostTypes = prev.filter(t => t !== type);
            // Ensure at least one postType is selected
            return newPostTypes.length > 0 ? newPostTypes : (type === 'job' ? ['tender'] : ['job']);
          });
        }
      });
    });

    // Categories
    selectedCategories.forEach(category => {
      applied.push({
        label: category,
        value: category,
        onRemove: () => {
          setSelectedCategories(prev => prev.filter(c => c !== category));
        }
      });
    });

    // Cities (only if no sublocalities are selected for that city)
    selectedCities.forEach(city => {
      const citySublocalities = selectedSublocalities.filter(s => s.startsWith(`${city}:`));
      // Only show city badge if no sublocalities are selected for this city
      if (citySublocalities.length === 0) {
        applied.push({
          label: city,
          value: `city-${city}`,
          onRemove: () => {
            handleCityChange(city, false);
          }
        });
      }
    });

    // Sublocalities
    selectedSublocalities.forEach(sublocalityKey => {
      const [city, sublocality] = sublocalityKey.split(':');
      applied.push({
        label: `${city} - ${sublocality}`,
        value: `sublocality-${sublocalityKey}`,
        onRemove: () => {
          handleSublocalityChange(city, sublocality, false);
        }
      });
    });

    // Provinces
    selectedProvinces.forEach(province => {
      applied.push({
        label: province,
        value: `province-${province}`,
        onRemove: () => {
          setSelectedProvinces(prev => prev.filter(p => p !== province));
        }
      });
    });

    // Client types
    selectedClientTypes.forEach(clientType => {
      applied.push({
        label: clientType,
        value: clientType,
        onRemove: () => {
          setSelectedClientTypes(prev => prev.filter(t => t !== clientType));
        }
      });
    });

    // Contract types
    selectedContractTypes.forEach(type => {
      applied.push({
        label: type,
        value: type,
        onRemove: () => {
          setSelectedContractTypes(prev => prev.filter(t => t !== type));
        }
      });
    });

    // Budget ranges
    selectedBudgetRanges.forEach(range => {
      const rangeLabels: Record<string, string> = {
        '<5000': 'Mniej niż 5000 PLN',
        '5000-20000': '5000 - 20000 PLN',
        '20000+': '20000+ PLN'
      };
      applied.push({
        label: rangeLabels[range] || range,
        value: `budget-${range}`,
        onRemove: () => {
          setSelectedBudgetRanges(prev => prev.filter(r => r !== range));
        }
      });
    });

    // Budget min/max
    if (budgetMin) {
      applied.push({
        label: `Budżet min: ${budgetMin} PLN`,
        value: 'budget-min',
        onRemove: () => {
          setBudgetMin('');
        }
      });
    }

    if (budgetMax) {
      applied.push({
        label: `Budżet max: ${budgetMax} PLN`,
        value: 'budget-max',
        onRemove: () => {
          setBudgetMax('');
        }
      });
    }

    // Search query
    if (searchQuery.trim()) {
      applied.push({
        label: `Szukaj: "${searchQuery}"`,
        value: 'search',
        onRemove: () => {
          setSearchQuery('');
        }
      });
    }

    // Urgency
    selectedUrgency.forEach(urgency => {
      const urgencyLabels: Record<string, string> = {
        'low': 'Niski priorytet',
        'medium': 'Średni priorytet',
        'high': 'Wysoki priorytet'
      };
      applied.push({
        label: urgencyLabels[urgency] || urgency,
        value: `urgency-${urgency}`,
        onRemove: () => {
          setSelectedUrgency(prev => prev.filter(u => u !== urgency));
        }
      });
    });

    // Ending soon filter
    if (endingSoon) {
      applied.push({
        label: 'Kończące się wkrótce',
        value: 'ending-soon',
        onRemove: () => {
          setEndingSoon(false);
        }
      });
    }

    // Date added filters
    selectedDateAdded.forEach(dateFilter => {
      const dateLabels: Record<string, string> = {
        'today': 'Dzisiaj',
        'last-week': 'Ostatni tydzień',
        'last-month': 'Ostatni miesiąc',
        'last-3-months': 'Ostatnie 3 miesiące',
        'last-6-months': 'Ostatnie 6 miesięcy',
        'last-year': 'Ostatni rok'
      };
      applied.push({
        label: dateLabels[dateFilter] || dateFilter,
        value: `date-${dateFilter}`,
        onRemove: () => {
          setSelectedDateAdded(prev => prev.filter(d => d !== dateFilter));
        }
      });
    });

    return applied;
  };

  return (
    <div 
      className="w-80 overflow-hidden h-full"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className={`flex-shrink-0 px-6 ${isMapView ? 'pt-6' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-gray-900">Filtry</h3>
            </div>
          </div>

            {/* Current Location Display */}
            {primaryLocation && primaryLocation !== 'Polska' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-normal text-blue-900">Aktualna lokalizacja</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-semibold">{primaryLocation}</span>
                  {onLocationChange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLocationChange}
                      className="h-6 px-2 py-1 text-xs hover:bg-blue-100 text-blue-600"
                      title="Zmień lokalizację"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Zmień
                    </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

              {/* Applied Filters */}
              {getAppliedFilters().length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold text-gray-700">Aktywne filtry</Label>
                    <div className="text-xs cursor-pointer flex items-center text-gray-500 hover:text-gray-900 h-auto py-0 px-2" onClick={clearAllFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Wyczyść wszystko
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getAppliedFilters().map((filter) => (
                      <Badge
                        key={filter.value}
                        variant="secondary"
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        onClick={filter.onRemove}
                      >
                        {filter.label}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Scrollable Filters Content */}
          <div 
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto px-6 ${isMapView ? 'pb-4' : 'pb-6'} max-h-[calc(100vh-20rem)] relative`}
          >

            {/* Post Type Filter */}
            <Collapsible
              open={expandedFilterSections.includes('post-type')}
              onOpenChange={() => toggleFilterSection('post-type')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Typ Ogłoszenia
                </Label>
                {expandedFilterSections.includes('post-type') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="job"
                      checked={selectedPostTypes.includes('job')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPostTypes(prev => [...prev, 'job']);
                        } else {
                          setSelectedPostTypes(prev => prev.filter(t => t !== 'job'));
                        }
                      }}
                    />
                    <Label htmlFor="job" className="text-sm cursor-pointer flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      <span className="text-foreground">Zlecenia</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="tender"
                      checked={selectedPostTypes.includes('tender')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPostTypes(prev => [...prev, 'tender']);
                        } else {
                          setSelectedPostTypes(prev => prev.filter(t => t !== 'tender'));
                        }
                      }}
                    />
                    <Label htmlFor="tender" className="text-sm cursor-pointer flex items-center space-x-2">
                      <Gavel className="w-4 h-4 text-orange-600" />
                      <span className="text-foreground">Przetargi</span>
                    </Label>
                  </div>

                  {/* Ending Soon Filter - Only show when tenders are selected */}
                  {selectedPostTypes.includes('tender') && (
                    <>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="flex items-center space-x-2">
                        <CustomCheckbox 
                          id="ending-soon"
                          checked={endingSoon}
                          onCheckedChange={setEndingSoon}
                        />
                        <Label htmlFor="ending-soon" className="text-sm cursor-pointer flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-foreground">Kończące się wkrótce (&lt;7 dni)</span>
                        </Label>
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Categories */}
            <Collapsible
              open={expandedFilterSections.includes('categories')}
              onOpenChange={() => toggleFilterSection('categories')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Kategorie
                </Label>
                {expandedFilterSections.includes('categories') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                {categories.length > 0 ? (
                  categories.map(category => (
                    <div key={category.name} className="flex items-center space-x-2">
                      <CustomCheckbox 
                        id={`category-${category.name}`}
                        checked={selectedCategories.includes(category.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories(prev => [...prev, category.name]);
                          } else {
                            setSelectedCategories(prev => prev.filter(c => c !== category.name));
                          }
                        }}
                      />
                      <Label htmlFor={`category-${category.name}`} className="text-sm cursor-pointer text-gray-900 font-light">
                        {category.name} ({category.count})
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 pl-2">Brak kategorii</div>
                )}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Location - Two Level (City and Province) */}
            <Collapsible
              open={expandedFilterSections.includes('location')}
              onOpenChange={() => toggleFilterSection('location')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Lokalizacja
                </Label>
                {expandedFilterSections.includes('location') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                {/* City Selection with Sublocalities */}
                <div className="space-y-3 mb-4">
                  <Label className="text-xs font-semibold text-gray-700 mb-2 block">Miasto</Label>
                  {cities.length > 0 ? (
                    cities.map(city => {
                      const cityCount = jobs.filter(job => {
                        const jobCity = extractCity(job.location);
                        return jobCity === city;
                      }).length;
                      
                      const sublocalities = getSublocalitiesForCity(city);
                      const hasSublocalities = sublocalities.length > 0;
                      
                      const isCityExpanded = expandedCities.has(city);
                      const isCitySelected = selectedCities.includes(city);
                      const showSublocalities = hasSublocalities && (isCitySelected || isCityExpanded);
                      
                      return (
                        <div key={city} className="space-y-1">
                          {/* City checkbox with expand/collapse */}
                          <div className="flex items-center space-x-2">
                            <CustomCheckbox 
                              id={`city-${city}`}
                              checked={isCitySelected}
                              onCheckedChange={(checked) => handleCityChange(city, checked)}
                            />
                            <Label htmlFor={`city-${city}`} className="text-sm cursor-pointer flex items-center text-gray-900 font-light flex-1">
                              <MapPin className="w-3 h-3 mr-1 text-gray-600" />
                              {city} ({cityCount})
                            </Label>
                            {hasSublocalities && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setExpandedCities(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(city)) {
                                      newSet.delete(city);
                                    } else {
                                      newSet.add(city);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
                                aria-label={isCityExpanded ? 'Zwiń' : 'Rozwiń'}
                              >
                                {isCityExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {/* Sublocalities nested under city - shown when city is selected or expanded */}
                          {showSublocalities && (
                            <div className="ml-6 space-y-1 pl-1 border-l-2 border-gray-200">
                              {sublocalities.map(sublocality => {
                                const sublocalityKey = `${city}:${sublocality}`;
                                const sublocalityCount = jobs.filter(job => {
                                  const jobCity = extractCity(job.location);
                                  const jobSublocality = extractSublocality(job.location);
                                  return jobCity === city && jobSublocality === sublocality;
                                }).length;
                                
                                return (
                                  <div key={sublocalityKey} className="flex items-center space-x-2">
                                    <CustomCheckbox 
                                      id={`sublocality-${sublocalityKey}`}
                                      checked={selectedSublocalities.includes(sublocalityKey)}
                                      onCheckedChange={(checked) => handleSublocalityChange(city, sublocality, checked)}
                                    />
                                    <Label htmlFor={`sublocality-${sublocalityKey}`} className="text-xs cursor-pointer flex items-center text-gray-700 font-light">
                                      {sublocality} ({sublocalityCount})
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-400 pl-2">Brak miast</div>
                  )}
                </div>

                {/* Province Selection - Only shown when cities are selected */}
                {selectedCities.length > 0 && availableProvinces.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Województwo</Label>
                    {availableProvinces.map(province => (
                      <div key={province} className="flex items-center space-x-2">
                        <CustomCheckbox 
                          id={`province-${province}`}
                          checked={selectedProvinces.includes(province)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProvinces(prev => [...prev, province]);
                            } else {
                              setSelectedProvinces(prev => prev.filter(p => p !== province));
                            }
                          }}
                        />
                        <Label htmlFor={`province-${province}`} className="text-sm cursor-pointer text-gray-900 font-light">
                          {province}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Client Type */}
            <Collapsible
              open={expandedFilterSections.includes('client-type')}
              onOpenChange={() => toggleFilterSection('client-type')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Typ Klienta
                </Label>
                {expandedFilterSections.includes('client-type') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                {['Wspólnota Mieszkaniowa', 'Spółdzielnia Mieszkaniowa'].map(clientType => {
                  const count = clientTypeCounts[clientType] || 0;
                  return (
                    <div key={clientType} className="flex items-center space-x-2">
                      <CustomCheckbox 
                        id={clientType}
                        checked={selectedClientTypes.includes(clientType)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClientTypes(prev => [...prev, clientType]);
                          } else {
                            setSelectedClientTypes(prev => prev.filter(t => t !== clientType));
                          }
                        }}
                      />
                      <Label htmlFor={clientType} className="text-sm cursor-pointer text-gray-900 font-light">
                        {clientType} ({count})
                      </Label>
                    </div>
                  );
                })}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Urgency Filter */}
            <Collapsible
              open={expandedFilterSections.includes('urgency')}
              onOpenChange={() => toggleFilterSection('urgency')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Priorytet
                </Label>
                {expandedFilterSections.includes('urgency') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="urgency-low"
                      checked={selectedUrgency.includes('low')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUrgency(prev => [...prev, 'low']);
                        } else {
                          setSelectedUrgency(prev => prev.filter(u => u !== 'low'));
                        }
                      }}
                    />
                    <Label htmlFor="urgency-low" className="text-sm cursor-pointer flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-green-600" />
                      <span className="text-foreground">Niski</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="urgency-medium"
                      checked={selectedUrgency.includes('medium')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUrgency(prev => [...prev, 'medium']);
                        } else {
                          setSelectedUrgency(prev => prev.filter(u => u !== 'medium'));
                        }
                      }}
                    />
                    <Label htmlFor="urgency-medium" className="text-sm cursor-pointer flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-foreground">Średni</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="urgency-high"
                      checked={selectedUrgency.includes('high')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUrgency(prev => [...prev, 'high']);
                        } else {
                          setSelectedUrgency(prev => prev.filter(u => u !== 'high'));
                        }
                      }}
                    />
                    <Label htmlFor="urgency-high" className="text-sm cursor-pointer flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-foreground">Wysoki (Pilne)</span>
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Date Added Filter */}
            <Collapsible
              open={expandedFilterSections.includes('date-added')}
              onOpenChange={() => toggleFilterSection('date-added')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Data dodania
                </Label>
                {expandedFilterSections.includes('date-added') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                  {[
                    { value: 'today', label: 'Dzisiaj' },
                    { value: 'last-week', label: 'Ostatni tydzień' },
                    { value: 'last-month', label: 'Ostatni miesiąc' },
                    { value: 'last-3-months', label: 'Ostatnie 3 miesiące' },
                    { value: 'last-6-months', label: 'Ostatnie 6 miesięcy' },
                    { value: 'last-year', label: 'Ostatni rok' }
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <CustomCheckbox 
                        id={`date-${value}`}
                        checked={selectedDateAdded.includes(value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDateAdded(prev => [...prev, value]);
                          } else {
                            setSelectedDateAdded(prev => prev.filter(d => d !== value));
                          }
                        }}
                      />
                      <Label htmlFor={`date-${value}`} className="text-sm cursor-pointer flex items-center space-x-2">
                        <Calendar className="w-3 h-3 mr-1 text-gray-600" />
                        <span className="text-foreground">{label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Budget Range */}
            <Collapsible
              open={expandedFilterSections.includes('budget')}
              onOpenChange={() => toggleFilterSection('budget')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Budżet
                </Label>
                {expandedFilterSections.includes('budget') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-3">
                  {/* Budget Range Checkboxes */}
                  <div className="space-y-2">
                    {[
                      { value: '<5000', label: 'Mniej niż 5000 PLN' },
                      { value: '5000-20000', label: '5000 - 20000 PLN' },
                      { value: '20000+', label: '20000+ PLN' }
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <CustomCheckbox 
                          id={`budget-${value}`}
                          checked={selectedBudgetRanges.includes(value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBudgetRanges(prev => [...prev, value]);
                            } else {
                              setSelectedBudgetRanges(prev => prev.filter(r => r !== value));
                            }
                          }}
                        />
                        <Label htmlFor={`budget-${value}`} className="text-sm cursor-pointer text-gray-900 font-light">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Budget Min/Max Inputs */}
                  <div className="pt-2 border-t">
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col space-y-1">
                        <Label htmlFor="budget-min-input" className="text-xs text-gray-700">Budżet min (PLN)</Label>
                        <input
                          id="budget-min-input"
                          type="number"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="flex-1 flex flex-col space-y-1">
                        <Label htmlFor="budget-max-input" className="text-xs text-gray-700">Budżet max (PLN)</Label>
                        <input
                          id="budget-max-input"
                          type="number"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Contract Type */}
            <Collapsible
              open={expandedFilterSections.includes('contract-type')}
              onOpenChange={() => toggleFilterSection('contract-type')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Typ Umowy
                </Label>
                {expandedFilterSections.includes('contract-type') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                {['Jednorazowe zlecenie', 'Stały zleceniodawca', 'Zlecenie okresowe', 'Serwis stały', 'Sezonowe zlecenie'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id={type}
                      checked={selectedContractTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedContractTypes(prev => [...prev, type]);
                        } else {
                          setSelectedContractTypes(prev => prev.filter(t => t !== type));
                        }
                      }}
                    />
                    <Label htmlFor={type} className="text-sm cursor-pointer flex items-center text-gray-900 font-light">
                      <Clock className="w-3 h-3 mr-1 text-gray-600" />
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Search Query - Always Open */}
            <div className="mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="mt-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Wpisz szukany termin"
                  />
                </div>
              </div>
            </div>

          {/* Scroll Indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg">
                <ArrowDown className="w-4 h-4 text-gray-600 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}