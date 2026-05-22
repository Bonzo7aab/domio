import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Check,
  Edit3,
  Calendar,
  Heart,
} from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { createClient } from '../lib/supabase/client';
import { fetchAllCategoriesWithSubcategories } from '../lib/database/categories';
import type { Job } from '../types/job';
import type { CategoryWithSubcategories } from '../lib/database/categories';
import type { FilterState, DeadlineFilterKey } from '../lib/filters/filter-state';
import { defaultFilters, WARSAW_CITY } from '../lib/filters/filter-state';
import { extractCity, extractSublocality } from '../utils/locationMapping';
import {
  getDeadlineFilterCounts,
  getWarsawDistrictsForFilters,
} from '../lib/filters/filter-logic';
import { DEADLINE_FILTER_OPTIONS } from '../lib/filters/deadline-labels';
import { cn } from './ui/utils';

export type { FilterState } from '../lib/filters/filter-state';

const EXPANDED_SECTIONS = ['categories', 'location', 'deadline', 'budget'] as const;

function filterOptionLabelClass(count: number, isSelected: boolean, size: 'sm' | 'xs' = 'sm'): string {
  return cn(
    'cursor-pointer font-light',
    size === 'xs' ? 'text-xs' : 'text-sm',
    isSelected ? 'text-gray-900' : count === 0 ? 'text-gray-400' : 'text-gray-800',
  );
}

function filterCountClass(count: number, isSelected: boolean): string {
  return cn(isSelected || count > 0 ? 'text-gray-500' : 'text-gray-300');
}

interface JobFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
  primaryLocation?: string;
  onLocationChange?: () => void;
  jobs?: Job[];
  initialFilters?: FilterState;
}

const CustomCheckbox: React.FC<{
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ id, checked, onCheckedChange }) => (
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

function SectionTrigger({
  title,
  open,
}: {
  title: string;
  open: boolean;
}) {
  return (
    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
      <Label className="text-sm font-bold text-gray-900 cursor-pointer">{title}</Label>
      {open ? (
        <ChevronUp className="w-4 h-4 text-gray-600" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-600" />
      )}
    </CollapsibleTrigger>
  );
}

export default function JobFilters({
  onFilterChange,
  primaryLocation,
  onLocationChange,
  jobs = [],
  initialFilters,
}: JobFiltersProps) {
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>([
    ...EXPANDED_SECTIONS,
  ]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [local, setLocal] = useState<FilterState>(initialFilters ?? defaultFilters);
  const [budgetMinStr, setBudgetMinStr] = useState(() =>
    initialFilters?.budgetMin != null ? String(initialFilters.budgetMin) : '',
  );
  const [budgetMaxStr, setBudgetMaxStr] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromSelfRef = useRef(false);
  const previousEmittedRef = useRef<string>('');
  const supabase = createClient();
  const [categoriesFromDb, setCategoriesFromDb] = useState<CategoryWithSubcategories[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- mirror URL/context filters into sidebar draft state */
  useEffect(() => {
    if (initialFilters && !isUpdatingFromSelfRef.current) {
      setLocal(initialFilters);
      if (initialFilters.budgetMin != null) {
        setBudgetMinStr(String(initialFilters.budgetMin));
      }
      if (initialFilters.budgetMax != null) {
        setBudgetMaxStr(String(initialFilters.budgetMax));
      }
    }
    isUpdatingFromSelfRef.current = false;
  }, [initialFilters]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const load = async () => {
      const { data } = await fetchAllCategoriesWithSubcategories(supabase);
      if (data) setCategoriesFromDb(data);
    };
    load();
  }, [supabase]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach((job) => {
      const name =
        typeof job.category === 'string' ? job.category : job.category?.name || '';
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach((job) => {
      if (job.subcategory) {
        counts[job.subcategory] = (counts[job.subcategory] || 0) + 1;
      }
    });
    return counts;
  }, [jobs]);

  const warsawDistricts = useMemo(() => getWarsawDistrictsForFilters(), []);

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const district of warsawDistricts) {
      counts[district] = 0;
    }
    jobs.forEach((job) => {
      if (extractCity(job.location) !== WARSAW_CITY) return;
      const sub = extractSublocality(job.location);
      if (sub && sub in counts) {
        counts[sub] += 1;
      }
    });
    return counts;
  }, [jobs, warsawDistricts]);

  const deadlineCounts = useMemo(() => getDeadlineFilterCounts(jobs), [jobs]);

  useEffect(() => {
    const budgetMin =
      budgetMinStr.trim() !== '' ? parseFloat(budgetMinStr) : undefined;
    const budgetMax =
      budgetMaxStr.trim() !== '' ? parseFloat(budgetMaxStr) : undefined;

    const next: FilterState = {
      ...local,
      budgetMin: budgetMin != null && !isNaN(budgetMin) ? budgetMin : undefined,
      budgetMax: budgetMax != null && !isNaN(budgetMax) ? budgetMax : undefined,
      postTypes: defaultFilters.postTypes,
    };

    const serialized = JSON.stringify(next);
    if (onFilterChange && serialized !== previousEmittedRef.current) {
      previousEmittedRef.current = serialized;
      isUpdatingFromSelfRef.current = true;
      onFilterChange(next);
    }
  }, [local, budgetMinStr, budgetMaxStr, onFilterChange]);

  const patch = (partial: Partial<FilterState>) => {
    setLocal((prev) => ({ ...prev, ...partial }));
  };

  const toggleSection = (name: string) => {
    setExpandedFilterSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDistrictChange = (district: string, checked: boolean) => {
    const key = `${WARSAW_CITY}:${district}`;
    patch({
      sublocalities: checked
        ? [...local.sublocalities, key]
        : local.sublocalities.filter((s) => s !== key),
    });
  };

  const toggleDeadline = (value: DeadlineFilterKey, checked: boolean) => {
    patch({
      deadline: checked
        ? [...local.deadline, value]
        : local.deadline.filter((d) => d !== value),
    });
  };

  return (
    <div
      className="flex h-full min-h-0 w-full max-h-full flex-col overflow-hidden bg-white lg:w-80"
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex-shrink-0 px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-gray-900">Filtry</h3>
            </div>
          </div>

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
        </div>

        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
        >
          <div className="mb-4 flex items-center space-x-2">
            <CustomCheckbox
              id="filter-favorites-only"
              checked={!!local.favoritesOnly}
              onCheckedChange={(checked) =>
                patch({ favoritesOnly: checked })
              }
            />
            <Label
              htmlFor="filter-favorites-only"
              className="text-sm cursor-pointer text-gray-900 font-light flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 text-gray-600" />
              Tylko ulubione
            </Label>
          </div>

          {/* Categories — always expanded at first level; subs on chevron */}
          <Collapsible
            open={expandedFilterSections.includes('categories')}
            onOpenChange={() => toggleSection('categories')}
            className="mb-4"
          >
            <SectionTrigger title="Kategorie" open={expandedFilterSections.includes('categories')} />
            <CollapsibleContent className="mt-3 pl-2">
              <div className="space-y-3">
                {categoriesFromDb.length > 0 ? (
                  categoriesFromDb.map((category) => {
                    const isSelected = local.categories.includes(category.name);
                    const isExpanded = expandedCategoryIds.has(category.id);
                    const count = categoryCounts[category.name] || 0;

                    return (
                      <div key={category.id} className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <CustomCheckbox
                            id={`category-${category.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                patch({
                                  categories: [...local.categories, category.name],
                                });
                              } else {
                                const subNames = category.subcategories.map((s) => s.name);
                                patch({
                                  categories: local.categories.filter((c) => c !== category.name),
                                  subcategories: local.subcategories.filter(
                                    (s) => !subNames.includes(s)
                                  ),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className={cn('flex-1', filterOptionLabelClass(count, isSelected))}
                          >
                            {category.name}{' '}
                            <span className={filterCountClass(count, isSelected)}>({count})</span>
                          </Label>
                          {category.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpand(category.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          )}
                        </div>
                        {isExpanded && category.subcategories.length > 0 && (
                          <div className="ml-6 space-y-1 pl-1 border-l-2 border-gray-200">
                            {category.subcategories.map((sub) => {
                              const subCount = subcategoryCounts[sub.name] || 0;
                              const subSelected = local.subcategories.includes(sub.name);
                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center space-x-2"
                                >
                                  <CustomCheckbox
                                    id={`sub-${sub.id}`}
                                    checked={subSelected}
                                    onCheckedChange={(checked) => {
                                      patch({
                                        subcategories: checked
                                          ? [...local.subcategories, sub.name]
                                          : local.subcategories.filter((s) => s !== sub.name),
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={`sub-${sub.id}`}
                                    className={filterOptionLabelClass(subCount, subSelected, 'xs')}
                                  >
                                    {sub.name}{' '}
                                    <span className={filterCountClass(subCount, subSelected)}>
                                      ({subCount})
                                    </span>
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
                  <div className="text-xs text-gray-400 pl-2">Brak kategorii</div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Location — Warsaw only */}
          <Collapsible
            open={expandedFilterSections.includes('location')}
            onOpenChange={() => toggleSection('location')}
            className="mb-4"
          >
            <SectionTrigger title="Lokalizacja" open={expandedFilterSections.includes('location')} />
            <CollapsibleContent className="mt-3 pl-2">
              <input
                type="text"
                value={WARSAW_CITY}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 text-sm mb-3"
                aria-label="Miasto"
              />
              <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                Dzielnica
              </Label>
              <div className="space-y-2">
                  {warsawDistricts.map((district) => {
                    const key = `${WARSAW_CITY}:${district}`;
                    const count = districtCounts[district] ?? 0;
                    const districtSelected = local.sublocalities.includes(key);
                    return (
                      <div key={district} className="flex items-center space-x-2">
                        <CustomCheckbox
                          id={`district-${district}`}
                          checked={districtSelected}
                          onCheckedChange={(checked) =>
                            handleDistrictChange(district, checked)
                          }
                        />
                        <Label
                          htmlFor={`district-${district}`}
                          className={filterOptionLabelClass(count, districtSelected)}
                        >
                          {district}{' '}
                          <span className={filterCountClass(count, districtSelected)}>
                            ({count})
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Termin realizacji */}
          <Collapsible
            open={expandedFilterSections.includes('deadline')}
            onOpenChange={() => toggleSection('deadline')}
            className="mb-4"
          >
            <SectionTrigger
              title="Termin realizacji"
              open={expandedFilterSections.includes('deadline')}
            />
            <CollapsibleContent className="mt-3 pl-2">
              <div className="space-y-2">
                {DEADLINE_FILTER_OPTIONS.map(({ value, label }) => {
                  const count = deadlineCounts[value] ?? 0;
                  const deadlineSelected = local.deadline.includes(value);
                  return (
                    <div key={value} className="flex items-center space-x-2">
                      <CustomCheckbox
                        id={`deadline-${value}`}
                        checked={deadlineSelected}
                        onCheckedChange={(checked) => toggleDeadline(value, checked)}
                      />
                      <Label
                        htmlFor={`deadline-${value}`}
                        className={cn(
                          'flex items-center gap-2',
                          filterOptionLabelClass(count, deadlineSelected),
                        )}
                      >
                        <Calendar
                          className={cn(
                            'w-3 h-3 shrink-0',
                            count === 0 && !deadlineSelected
                              ? 'text-gray-300'
                              : 'text-gray-600',
                          )}
                        />
                        <span>
                          {label}{' '}
                          <span className={filterCountClass(count, deadlineSelected)}>
                            ({count})
                          </span>
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Budget — range only */}
          <Collapsible
            open={expandedFilterSections.includes('budget')}
            onOpenChange={() => toggleSection('budget')}
            className="mb-4"
          >
            <SectionTrigger title="Budżet" open={expandedFilterSections.includes('budget')} />
            <CollapsibleContent className="mt-3 pl-2">
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col space-y-1">
                  <Label htmlFor="budget-min-input" className="text-xs text-gray-700">
                    Budżet min (PLN)
                  </Label>
                  <input
                    id="budget-min-input"
                    type="number"
                    value={budgetMinStr}
                    onChange={(e) => setBudgetMinStr(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="flex-1 flex flex-col space-y-1">
                  <Label htmlFor="budget-max-input" className="text-xs text-gray-700">
                    Budżet max (PLN)
                  </Label>
                  <input
                    id="budget-max-input"
                    type="number"
                    value={budgetMaxStr}
                    onChange={(e) => setBudgetMaxStr(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
