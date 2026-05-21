'use client';

import React from 'react';
import { MapPin, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import type { FilterState } from '../lib/filters/filter-state';
import { defaultFilters, WARSAW_CITY } from '../lib/filters/filter-state';
import { getDeadlineFilterLabel } from '../lib/filters/deadline-labels';

interface ActiveFilterChipsProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  primaryLocation?: string;
}

export function ActiveFilterChips({
  filters,
  onFilterChange,
  primaryLocation,
}: ActiveFilterChipsProps) {
  const chips: Array<{ label: string; value: string; onRemove: () => void }> = [];

  filters.categories.forEach((category) => {
    chips.push({
      label: category,
      value: `cat-${category}`,
      onRemove: () =>
        onFilterChange((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c !== category),
        })),
    });
  });

  filters.subcategories.forEach((sub) => {
    chips.push({
      label: sub,
      value: `sub-${sub}`,
      onRemove: () =>
        onFilterChange((prev) => ({
          ...prev,
          subcategories: prev.subcategories.filter((s) => s !== sub),
        })),
    });
  });

  filters.sublocalities.forEach((key) => {
    const [, district] = key.split(':');
    chips.push({
      label: district || key,
      value: `loc-${key}`,
      onRemove: () =>
        onFilterChange((prev) => ({
          ...prev,
          sublocalities: prev.sublocalities.filter((s) => s !== key),
        })),
    });
  });

  filters.deadline.forEach((d) => {
    chips.push({
      label: getDeadlineFilterLabel(d),
      value: `deadline-${d}`,
      onRemove: () =>
        onFilterChange((prev) => ({
          ...prev,
          deadline: prev.deadline.filter((x) => x !== d),
        })),
    });
  });

  if (filters.budgetMin != null) {
    chips.push({
      label: `Budżet min: ${filters.budgetMin} PLN`,
      value: 'budget-min',
      onRemove: () =>
        onFilterChange((prev) => ({ ...prev, budgetMin: undefined })),
    });
  }

  if (filters.budgetMax != null) {
    chips.push({
      label: `Budżet max: ${filters.budgetMax} PLN`,
      value: 'budget-max',
      onRemove: () =>
        onFilterChange((prev) => ({ ...prev, budgetMax: undefined })),
    });
  }

  if (filters.searchQuery?.trim()) {
    chips.push({
      label: `Szukaj: "${filters.searchQuery.trim()}"`,
      value: 'search',
      onRemove: () =>
        onFilterChange((prev) => ({ ...prev, searchQuery: '' })),
    });
  }

  const showLocationBadge =
    primaryLocation && primaryLocation !== 'Polska' && primaryLocation !== WARSAW_CITY;

  if (chips.length === 0 && !showLocationBadge) {
    return null;
  }

  const clearAll = () => onFilterChange(defaultFilters);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-semibold text-gray-700">Aktywne filtry</Label>
        <button
          type="button"
          className="text-xs cursor-pointer flex items-center text-red-400 hover:text-gray-900 h-auto py-0 px-2"
          onClick={clearAll}
        >
          <X className="h-3 w-3 mr-1" />
          Wyczyść wszystko
        </button>
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        {showLocationBadge && (
          <Badge
            variant="secondary"
            className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 text-gray-700"
          >
            <MapPin className="w-3 h-3 text-gray-600 mr-1 inline" />
            {primaryLocation}
          </Badge>
        )}
        {chips.map((chip) => (
          <Badge
            key={chip.value}
            variant="secondary"
            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
            onClick={chip.onRemove}
          >
            {chip.label}
            <X className="h-3 w-3 ml-1 inline" />
          </Badge>
        ))}
      </div>
    </div>
  );
}
