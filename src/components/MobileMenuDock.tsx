'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Bookmark, 
  MessageCircle, 
  User,
  Briefcase,
  Users,
  DollarSign,
  Menu,
  SlidersHorizontal,
  Map
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { MenuDock, type MenuDockItem } from './ui/menu-dock';
import { useUserProfile } from '../contexts/AuthContext';
import { useLayoutContext } from './ConditionalFooter';
import { useFilterContext } from '../contexts/FilterContext';
import JobFilters from './JobFilters';

export function MobileMenuDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useUserProfile();
  const { isMapExpanded, setIsMapExpanded } = useLayoutContext();
  const { filters, setFilters, primaryLocation, onLocationChangeRequest } = useFilterContext();
  
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  const isHomepage = pathname === '/';
  const isCompactMode = isHomepage || isMapExpanded;

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const menuItems: MenuDockItem[] = [
    {
      label: 'Strona główna',
      icon: Home,
      onClick: () => {
        router.push('/');
        setMenuDrawerOpen(false);
      },
      active: isActive('/'),
    },
    {
      label: 'Szukaj',
      icon: Search,
      onClick: () => {
        // Trigger command palette
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          ctrlKey: navigator.platform.includes('Mac') ? false : true,
        });
        document.dispatchEvent(event);
        setMenuDrawerOpen(false);
      },
    },
    {
      label: 'Wykonawcy',
      icon: Briefcase,
      onClick: () => {
        router.push('/contractors');
        setMenuDrawerOpen(false);
      },
      active: isActive('/contractors'),
    },
    {
      label: 'Zarządcy',
      icon: Users,
      onClick: () => {
        router.push('/managers');
        setMenuDrawerOpen(false);
      },
      active: isActive('/managers'),
    },
    {
      label: 'Zapisane',
      icon: Bookmark,
      onClick: () => {
        router.push('/bookmarked-jobs');
        setMenuDrawerOpen(false);
      },
      active: isActive('/bookmarked-jobs'),
    },
    ...(isAuthenticated
      ? [
          {
            label: 'Wiadomości',
            icon: MessageCircle,
            onClick: () => {
              router.push('/messages');
              setMenuDrawerOpen(false);
            },
            active: isActive('/messages'),
          } as MenuDockItem,
          {
            label: 'Profil',
            icon: User,
            onClick: () => {
              router.push('/account');
              setMenuDrawerOpen(false);
            },
            active: isActive('/account'),
          } as MenuDockItem,
        ]
      : [
          {
            label: 'Cennik',
            icon: DollarSign,
            onClick: () => {
              router.push('/pricing');
              setMenuDrawerOpen(false);
            },
            active: isActive('/pricing'),
          } as MenuDockItem,
          {
            label: 'Zaloguj',
            icon: User,
            onClick: () => {
              router.push('/user-type-selection');
              setMenuDrawerOpen(false);
            },
          } as MenuDockItem,
        ]),
  ];

  // Compact mode: Filters button + Separator + Hamburger menu
  if (isCompactMode) {
    return (
      <>
        {/* Filters Drawer - always rendered */}
        <Drawer open={filtersDrawerOpen} onOpenChange={setFiltersDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Filtry</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1">
              <div className="w-full">
                <JobFilters
                  onFilterChange={setFilters}
                  primaryLocation={primaryLocation}
                  onLocationChange={onLocationChangeRequest}
                  forceExpanded={true}
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Menu Drawer - always rendered */}
        <Drawer open={menuDrawerOpen} onOpenChange={setMenuDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b">
              <DrawerTitle>Menu</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={index}
                      variant={item.active ? 'secondary' : 'ghost'}
                      className={`w-full justify-start ${item.active ? 'bg-primary/10 text-primary' : ''}`}
                      onClick={item.onClick}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Dock container - hidden when filters drawer is open, visible on mobile and tablet */}
        {!filtersDrawerOpen && (
          <div className="fixed bottom-4 left-1/2 z-[100] mobile-bottom-nav lg:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', transform: 'translateX(-50%)' }}>
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 w-auto max-w-[calc(100vw-2rem)]" style={{ backgroundColor: '#e2e8f0' }}>
              {/* Map Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg hover:bg-accent/50 shrink-0"
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                title={isMapExpanded ? 'Ukryj mapę' : 'Pokaż mapę'}
                style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}
              >
                <Map className={`h-4 w-4 ${isMapExpanded ? 'text-primary' : ''}`} />
              </Button>
              {/* Filters Button */}
              <Drawer open={filtersDrawerOpen} onOpenChange={setFiltersDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-1 min-w-0 max-w-[200px] justify-start h-10 rounded-lg hover:bg-accent/50"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2 shrink-0" />
                    <span className="text-sm truncate">Filtry</span>
                  </Button>
                </DrawerTrigger>
              </Drawer>

              {/* Separator */}
              <Separator orientation="vertical" className="h-8" />


              {/* Hamburger Menu Button */}
              <Drawer open={menuDrawerOpen} onOpenChange={setMenuDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-accent/50 shrink-0"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
              </Drawer>
            </div>
          </div>
        )}
      </>
    );
  }

  // Normal mode: Show all menu items - visible on mobile and tablet
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] mobile-bottom-nav lg:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', transform: 'translateX(-50%)' }}>
      <MenuDock
        items={menuItems}
        variant="compact"
        orientation="horizontal"
        showLabels={false}
        className="px-3 py-2"
      />
    </div>
  );
}
