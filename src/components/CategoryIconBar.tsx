'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFilterContext } from '../contexts/FilterContext';
import { createClient } from '../lib/supabase/client';
import { fetchAllCategories } from '../lib/database/categories';
import { getAllCategoryConfigs, getCategoryConfig } from '../lib/config/categoryConfig';
import { cn } from './ui/utils';
import type { Category } from '../lib/database/categories';

interface CategoryIconBarProps {
  jobs?: Array<{ 
    category?: string | { name?: string; slug?: string };
    status?: string;
  }>;
}

export default function CategoryIconBar({ jobs = [] }: CategoryIconBarProps) {
  const { filters, setFilters } = useFilterContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch categories from database
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      const { data, error } = await fetchAllCategories(supabase);
      if (!error && data) {
        // Sort by slug to match the order in config
        const configs = getAllCategoryConfigs();
        const sorted = data.sort((a, b) => {
          const aIndex = configs.findIndex(c => c.slug === a.slug);
          const bIndex = configs.findIndex(c => c.slug === b.slug);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setCategories(sorted);
      }
      setIsLoading(false);
    };

    loadCategories();
  }, [supabase]);

  // Calculate job counts per category (only active jobs)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    jobs.forEach(job => {
      // Filter for active jobs only
      // Check if job has status field (from database) or if it's already filtered
      const jobStatus = job.status;
      if (jobStatus && jobStatus !== 'active') {
        return; // Skip non-active jobs
      }
      
      const categoryName = typeof job.category === 'string' 
        ? job.category 
        : (job.category?.name || '');
      
      if (categoryName) {
        counts[categoryName] = (counts[categoryName] || 0) + 1;
      }
    });

    return counts;
  }, [jobs]);

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    setFilters(prev => {
      const currentCategories = prev.categories || [];
      const isSelected = currentCategories.includes(categoryName);
      
      if (isSelected) {
        // Deselect category and clear subcategories
        return {
          ...prev,
          categories: currentCategories.filter(c => c !== categoryName),
          subcategories: prev.subcategories || [] // Keep subcategories for now, will be filtered by JobFilters
        };
      } else {
        // Select category
        return {
          ...prev,
          categories: [...currentCategories, categoryName]
        };
      }
    });
  };

  // Check if category is selected
  const isCategorySelected = (categoryName: string) => {
    return (filters.categories || []).includes(categoryName);
  };

  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll handlers
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [categories]);

  if (isLoading) {
    return (
      <div className="w-full bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="flex-shrink-0 w-36 sm:w-40 h-28 sm:h-32 bg-muted/40 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-b border-border relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 relative">
        {/* Left Arrow - Mobile Only */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 sm:hidden bg-white rounded-full p-2 shadow-lg border border-border hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        {/* Right Arrow - Mobile Only */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 sm:hidden bg-white rounded-full p-2 shadow-lg border border-border hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 pl-2 sm:pl-0 sm:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollPaddingLeft: '0.5rem', scrollPaddingRight: '0.5rem' }}
        >
            {categories.map(category => {
              const config = getCategoryConfig(category.slug);
              if (!config) return null;

              const Icon = config.icon;
              const isSelected = isCategorySelected(category.name);
              const count = categoryCounts[category.name] || 0;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.name)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center gap-2',
                    'w-36 sm:w-40 h-24 sm:h-28',
                    'rounded-xl transition-colors duration-200',
                    'pt-3 pb-2.5',
                    'focus:outline-none',
                    isSelected
                      ? 'bg-primary/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/20'
                      : 'bg-transparent hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30'
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${config.color}08`,
                        } as React.CSSProperties
                      : undefined
                  }
                  aria-label={`Filtruj po kategorii: ${category.name}`}
                >
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg transition-colors",
                      isSelected ? "" : "bg-muted"
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${config.color}20`,
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 transition-colors",
                        isSelected ? "" : "text-muted-foreground"
                      )}
                      style={isSelected ? { color: config.color } : undefined}
                    />
                  </div>
                  {count > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 text-[9px] min-w-[16px] h-4 px-1.5 rounded-full font-semibold flex items-center justify-center",
                        isSelected ? "text-white" : "text-white bg-gray-600"
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: config.color,
                            }
                          : undefined
                      }
                    >
                      {count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 w-full px-2 flex-1 justify-start min-h-0">
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-3",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}
                    style={isSelected ? { color: config.color } : undefined}
                  >
                    {category.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
