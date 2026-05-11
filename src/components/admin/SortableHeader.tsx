'use client';

import React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../ui/utils';

export type SortDirection = 'asc' | 'desc';

export interface SortState<TKey extends string> {
  key: TKey;
  direction: SortDirection;
}

interface SortableHeaderProps<TKey extends string> {
  label: string;
  sortKey: TKey;
  sort: SortState<TKey> | null;
  onSortChange: (next: SortState<TKey>) => void;
  className?: string;
}

export function SortableHeader<TKey extends string>({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: SortableHeaderProps<TKey>) {
  const active = sort?.key === sortKey;
  const direction = active ? sort!.direction : null;

  const toggle = () => {
    if (!active) {
      onSortChange({ key: sortKey, direction: 'desc' });
      return;
    }
    onSortChange({ key: sortKey, direction: direction === 'desc' ? 'asc' : 'desc' });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground',
        active && 'text-foreground',
        className
      )}
      aria-sort={!active ? 'none' : direction === 'asc' ? 'ascending' : 'descending'}
    >
      <span>{label}</span>
      {active ? (
        direction === 'asc' ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}
