import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Star, Gavel, Wrench, Check, X, Edit3, ChevronDown as ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

export interface FilterState {
  categories: string[];
  subcategories: string[];
  contractTypes: string[];
  locations: string[];
  salaryRange: [number, number];
  rating: number;
  clientTypes: string[];
  postTypes: string[]; // Zlecenia vs Przetargi
  tenderTypes: string[]; // Typy przetargów (tylko gdy wybrano przetargi)
  searchRadius?: number;
  useGeolocation?: boolean;
  searchQuery?: string; // Dodane pole wyszukiwania
}

interface JobFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
  primaryLocation?: string;
  onLocationChange?: () => void;
  jobs?: any[]; // Available jobs to calculate dynamic categories/subcategories
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


export default function JobFilters({ onFilterChange, primaryLocation, onLocationChange, jobs = [] }: JobFiltersProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>(['post-type']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>([]);
  const [selectedPostTypes, setSelectedPostTypes] = useState<string[]>(['job', 'tender']);
  const [selectedTenderTypes, setSelectedTenderTypes] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [searchRadius, setSearchRadius] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate categories and subcategories dynamically from jobs
  const categories = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Group jobs by category
    const categoryMap = new Map<string, { count: number; subcategories: Map<string, number> }>();

    jobs.forEach(job => {
      const categoryName = job.category || 'Inne';
      const subcategoryName = job.subcategory;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { count: 0, subcategories: new Map<string, number>() });
      }

      const categoryData = categoryMap.get(categoryName)!;
      categoryData.count += 1;

      if (subcategoryName) {
        const currentCount = categoryData.subcategories.get(subcategoryName) || 0;
        categoryData.subcategories.set(subcategoryName, currentCount + 1);
      }
    });

    // Convert to array format with sorted subcategories
    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        subcategories: Array.from(data.subcategories.keys()).sort()
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [jobs]);

  // Extract unique locations from jobs
  const locations = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return [];
    }

    const locationSet = new Set<string>();
    jobs.forEach(job => {
      if (job.location) {
        locationSet.add(job.location);
      }
    });

    return Array.from(locationSet).sort();
  }, [jobs]);

  // Emit filter changes to parent
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        categories: selectedCategories,
        subcategories: selectedSubcategories,
        contractTypes: selectedContractTypes,
        locations: selectedLocations,
        clientTypes: selectedClientTypes,
        postTypes: selectedPostTypes,
        tenderTypes: selectedTenderTypes,
        salaryRange,
        rating: minRating,
        useGeolocation,
        searchRadius,
        searchQuery
      });
    }
  }, [selectedCategories, selectedSubcategories, selectedContractTypes, selectedLocations, selectedClientTypes, selectedPostTypes, selectedTenderTypes, salaryRange, minRating, useGeolocation, searchRadius, searchQuery, onFilterChange]);

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
  }, [expandedFilterSections, expandedCategories]); // Re-check when sections expand/collapse

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleFilterSection = (sectionName: string) => {
    setExpandedFilterSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedContractTypes([]);
    setSelectedLocations([]);
    setSelectedClientTypes([]);
    setSelectedPostTypes(['job', 'tender']); // Domyślnie pokazuj wszystkie typy
    setSelectedTenderTypes([]);
    setSalaryRange([0, 200]);
    setMinRating(0);
    setUseGeolocation(false);
    setSearchRadius(25);
    setSearchQuery('');
  };

  // Get all applied filters
  const getAppliedFilters = () => {
    const applied: Array<{ label: string; value: string; onRemove: () => void }> = [];

    // Post types
    if (selectedPostTypes.length < 2) {
      selectedPostTypes.forEach(type => {
        applied.push({
          label: type === 'job' ? 'Zlecenia' : 'Przetargi',
          value: type,
          onRemove: () => {
            setSelectedPostTypes(prev => prev.filter(t => t !== type));
          }
        });
      });
    }

    // Tender types
    selectedTenderTypes.forEach(type => {
      applied.push({
        label: type,
        value: type,
        onRemove: () => {
          setSelectedTenderTypes(prev => prev.filter(t => t !== type));
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

    // Subcategories
    selectedSubcategories.forEach(sub => {
      applied.push({
        label: sub,
        value: sub,
        onRemove: () => {
          setSelectedSubcategories(prev => prev.filter(c => c !== sub));
        }
      });
    });

    // Locations
    selectedLocations.forEach(location => {
      applied.push({
        label: location,
        value: location,
        onRemove: () => {
          setSelectedLocations(prev => prev.filter(l => l !== location));
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

    // Salary range
    if (salaryRange[0] > 0 || salaryRange[1] < 200) {
      applied.push({
        label: `Stawka: ${salaryRange[0]}-${salaryRange[1]} zł/h`,
        value: 'salary-range',
        onRemove: () => {
          setSalaryRange([0, 200]);
        }
      });
    }

    // Rating
    if (minRating > 0) {
      applied.push({
        label: `Ocena: ${minRating}+`,
        value: 'rating',
        onRemove: () => {
          setMinRating(0);
        }
      });
    }

    // Geolocation
    if (useGeolocation) {
      applied.push({
        label: `Odległość: ${searchRadius} km`,
        value: 'geolocation',
        onRemove: () => {
          setUseGeolocation(false);
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

    return applied;
  };

  return (
    <div 
      className="w-80 overflow-hidden h-full"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6">
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
            className="flex-1 overflow-y-auto px-6 pb-6 max-h-[calc(100vh-20rem)] relative"
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
                {/* Zlecenia bezpośrednie */}
                <div className="space-y-1">
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
                      <span className="text-foreground">Zlecenia bezpośrednie</span>
                    </Label>
                  </div>
                  <div className="text-xs font-light text-foreground pl-6">
                    Bezpośrednie aplikowanie, szybkie procesy
                  </div>
                </div>

                {/* Przetargi z sub-filtrami */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="tender"
                      checked={selectedPostTypes.includes('tender')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPostTypes(prev => [...prev, 'tender']);
                        } else {
                          setSelectedPostTypes(prev => prev.filter(t => t !== 'tender'));
                          setSelectedTenderTypes([]);
                        }
                      }}
                    />
                    <Label htmlFor="tender" className="text-sm cursor-pointer flex items-center space-x-2">
                      <Gavel className="w-4 h-4 text-orange-600" />
                      <span className="text-foreground">Przetargi</span>
                    </Label>
                  </div>
                  <div className="text-xs font-light text-foreground pl-6">
                    Formalna konkurencja, duże projekty
                  </div>

                  {/* Sub-filtry dla przetargów */}
                  {selectedPostTypes.includes('tender') && (
                    <div className="ml-6 mt-2 space-y-2 border-l-2 border-orange-600/20 pl-3">
                      {[
                        { value: 'Przetarg publiczny', label: 'Przetarg publiczny', description: 'Otwarty dla wszystkich wykonawców' },
                        { value: 'Przetarg ograniczony', label: 'Przetarg ograniczony', description: 'Tylko wybrani wykonawcy' }
                      ].map(({ value, label, description }) => (
                        <div key={value} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CustomCheckbox 
                              id={value}
                              checked={selectedTenderTypes.includes(value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTenderTypes(prev => [...prev, value]);
                                } else {
                                  setSelectedTenderTypes(prev => prev.filter(t => t !== value));
                                }
                              }}
                            />
                            <Label htmlFor={value} className="text-sm cursor-pointer">
                              <span className="font-medium text-foreground">{label}</span>
                            </Label>
                          </div>
                          <div className="text-xs text-foreground pl-6">
                            {description}
                          </div>
                        </div>
                      ))}
                    </div>
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
                    <div key={category.name}>
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-2 flex-1">
                          <CustomCheckbox 
                            id={`category-${category.name}`}
                            checked={selectedCategories.includes(category.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories(prev => [...prev, category.name]);
                              } else {
                                setSelectedCategories(prev => prev.filter(c => c !== category.name));
                                // Also remove subcategories of this category
                                const categorySubs = category.subcategories;
                                setSelectedSubcategories(prev => 
                                  prev.filter(sub => !categorySubs.includes(sub))
                                );
                              }
                            }}
                          />
                          <span className="text-sm text-foreground">{category.name}</span>
                          <span className="text-xs text-gray-500">({category.count})</span>
                        </div>
                        <div
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(category.name);
                          }}
                        >
                          {expandedCategories.includes(category.name) ? 
                            <ChevronUp className="w-4 h-4 text-foreground" /> : 
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          }
                        </div>
                      </div>
                      
                      {expandedCategories.includes(category.name) && (
                        <div className="ml-4 space-y-2 mt-2">
                          {category.subcategories.length > 0 ? (
                            category.subcategories.map(sub => {
                              // Calculate count for this subcategory
                              const subCount = jobs.filter(job => 
                                job.category === category.name && job.subcategory === sub
                              ).length;
                              
                              return (
                                <div key={sub} className="flex items-center space-x-2">
                                  <CustomCheckbox 
                                    id={sub}
                                    checked={selectedSubcategories.includes(sub)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedSubcategories(prev => [...prev, sub]);
                                      } else {
                                        setSelectedSubcategories(prev => prev.filter(c => c !== sub));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={sub} className="text-sm text-gray-500 font-light cursor-pointer">
                                    {sub} ({subCount})
                                  </Label>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-gray-400 pl-6">(0)</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 pl-2">(0)</div>
                )}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Location */}
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
                <div className="space-y-2">
                {locations.length > 0 ? (
                  locations.map(location => {
                    const locationCount = jobs.filter(job => job.location === location).length;
                    return (
                      <div key={location} className="flex items-center space-x-2">
                        <CustomCheckbox 
                          id={location}
                          checked={selectedLocations.includes(location)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLocations(prev => [...prev, location]);
                            } else {
                              setSelectedLocations(prev => prev.filter(l => l !== location));
                            }
                          }}
                        />
                        <Label htmlFor={location} className="text-sm cursor-pointer flex items-center text-gray-900 font-light">
                          <MapPin className="w-3 h-3 mr-1 text-gray-600" />
                          {location} ({locationCount})
                        </Label>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-400 pl-2">(0)</div>
                )}
              </div>
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
                {['Wspólnota Mieszkaniowa', 'Spółdzielnia Mieszkaniowa'].map(clientType => (
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
                      {clientType}
                    </Label>
                  </div>
                ))}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Salary Range */}
            <Collapsible
              open={expandedFilterSections.includes('salary')}
              onOpenChange={() => toggleFilterSection('salary')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Stawka
                </Label>
                {expandedFilterSections.includes('salary') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="px-2">
                <Slider
                  value={salaryRange}
                  onValueChange={(value) => setSalaryRange([value[0], value[1]])}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-900 mt-2">
                  <span>0 zł/h</span>
                  <span>{salaryRange[0]} zł/h</span>
                  <span>200+ zł/h</span>
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

            {/* Geographic Filters */}
            <Collapsible
              open={expandedFilterSections.includes('geographic')}
              onOpenChange={() => toggleFilterSection('geographic')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Filtry Geograficzne
                </Label>
                {expandedFilterSections.includes('geographic') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id="use-geolocation"
                      checked={useGeolocation}
                      onCheckedChange={(checked) => setUseGeolocation(checked)}
                    />
                    <Label htmlFor="use-geolocation" className="text-sm cursor-pointer text-gray-900 font-light">
                      Filtruj według odległości
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 pl-6">
                    Wybierz miasto na mapie, aby filtrować zlecenia według odległości
                  </p>
                </div>
                
                {useGeolocation && (
                  <div className="space-y-2 pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-900 font-light">Promień wyszukiwania</Label>
                      <span className="text-sm text-gray-600">{searchRadius} km</span>
                    </div>
                    <Slider
                      value={[searchRadius]}
                      onValueChange={(value) => setSearchRadius(value[0])}
                      max={100}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-900">
                      <span>5 km</span>
                      <span>100 km</span>
                    </div>
                  </div>
                )}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Rating Filter */}
            <Collapsible
              open={expandedFilterSections.includes('rating')}
              onOpenChange={() => toggleFilterSection('rating')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Minimalna Ocena
                </Label>
                {expandedFilterSections.includes('rating') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="space-y-2">
                {[0, 3, 4, 4.5].map(rating => (
                  <div key={rating} className="flex items-center space-x-2">
                    <CustomCheckbox 
                      id={`rating-${rating}`}
                      checked={minRating === rating}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMinRating(rating);
                        } else {
                          setMinRating(0);
                        }
                      }}
                    />
                    <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center text-gray-900 font-light">
                      <div className="flex items-center space-x-1">
                        {rating === 0 ? (
                          <span>Wszystkie oceny</span>
                        ) : (
                          <>
                            <span>{rating}+</span>
                            {[...Array(Math.floor(rating))].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            ))}
                          </>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Search Query */}
            <Collapsible
              open={expandedFilterSections.includes('search')}
              onOpenChange={() => toggleFilterSection('search')}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Label className="text-sm font-bold text-gray-900 cursor-pointer">
                  Szukaj
                </Label>
                {expandedFilterSections.includes('search') ? 
                  <ChevronUp className="w-4 h-4 text-gray-600" /> : 
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 pl-2">
                <div className="px-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Wpisz szukany termin"
                />
              </div>
              </CollapsibleContent>
            </Collapsible>

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