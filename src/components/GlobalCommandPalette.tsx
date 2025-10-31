'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { useUserProfile } from '../contexts/AuthContext';
import { sitemapEntries, getFilteredSitemap, getSitemapByCategory, type SitemapEntry } from '../lib/sitemap';

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserProfile();

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Get filtered sitemap based on user state
  const filteredEntries = getFilteredSitemap(isAuthenticated, user?.userType);
  const groupedEntries = getSitemapByCategory(filteredEntries);

  const handleSelect = (entry: SitemapEntry) => {
    if (entry.path === '#') {
      // Handle special actions
      if (entry.label === 'Wyloguj się') {
        logout();
        setOpen(false);
        return;
      }
      // Handle other special actions like messages, notifications
      console.log(`Special action: ${entry.label}`);
      setOpen(false);
      return;
    }

    // Navigate to the selected path
    router.push(entry.path);
    setOpen(false);
  };

  const runCommand = (value: string) => {
    // Find the entry that matches the selected value
    const entry = filteredEntries.find(e => e.label === value);
    if (entry) {
      handleSelect(entry);
    }
  };

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      title="Command Palette"
      description="Szukaj i nawiguj po platformie..."
    >
      <CommandInput 
        placeholder="Szukaj stron, funkcji lub wpisz komendę..." 
        className="h-12 text-sm px-4 focus:ring-0 focus:ring-offset-0 focus:outline-none"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg">🔍</span>
            </div>
            <p>Nie znaleziono wyników</p>
            <p className="text-xs">Spróbuj innych słów kluczowych</p>
          </div>
        </CommandEmpty>
        
        {Object.entries(groupedEntries).map(([category, entries], index) => (
          <React.Fragment key={category}>
            <CommandGroup heading={category}>
              {entries.map((entry) => {
                const Icon = entry.icon;
                return (
                  <CommandItem
                    key={`${entry.category}-${entry.label}`}
                    value={`${entry.label} ${entry.description} ${entry.keywords.join(' ')}`}
                    onSelect={() => handleSelect(entry)}
                    className="flex items-center space-x-4 px-4 py-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{entry.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {entry.description}
                      </div>
                    </div>
                    {entry.shortcut && (
                      <div className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {entry.shortcut}
                      </div>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {index < Object.keys(groupedEntries).length - 1 && (
              <CommandSeparator />
            )}
          </React.Fragment>
        ))}
        
        {/* Footer with keyboard shortcuts */}
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">↑↓</kbd>
                <span>nawiguj</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">↵</kbd>
                <span>wybierz</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">esc</kbd>
                <span>zamknij</span>
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">K</kbd>
              <span>otwórz</span>
            </div>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  );
}
