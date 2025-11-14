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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { FloatingDock, type FloatingDockItem } from './ui/floating-dock';
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

  const getPathForLabel = (title: string): string => {
    const titleToPath: Record<string, string> = {
      'Strona główna': '/',
      'Wykonawcy': '/contractors',
      'Zarządcy': '/managers',
      'Zapisane': '/bookmarked-jobs',
      'Wiadomości': '/messages',
      'Profil': '/account',
      'Cennik': '/pricing',
    };
    return titleToPath[title] || '';
  };

  const menuItems: FloatingDockItem[] = [
    {
      title: 'Strona główna',
      icon: <Home className="size-6" />,
      href: '/',
      onClick: () => {
        router.push('/');
        setMenuDrawerOpen(false);
      },
    },
    {
      title: 'Szukaj',
      icon: <Search className="size-6" />,
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
      title: 'Wykonawcy',
      icon: <Briefcase className="size-6" />,
      href: '/contractors',
      onClick: () => {
        router.push('/contractors');
        setMenuDrawerOpen(false);
      },
    },
    {
      title: 'Zarządcy',
      icon: <Users className="size-6" />,
      href: '/managers',
      onClick: () => {
        router.push('/managers');
        setMenuDrawerOpen(false);
      },
    },
    {
      title: 'Zapisane',
      icon: <Bookmark className="size-6" />,
      href: '/bookmarked-jobs',
      onClick: () => {
        router.push('/bookmarked-jobs');
        setMenuDrawerOpen(false);
      },
    },
    ...(isAuthenticated
      ? [
          {
            title: 'Wiadomości',
            icon: <MessageCircle className="size-6" />,
            href: '/messages',
            onClick: () => {
              router.push('/messages');
              setMenuDrawerOpen(false);
            },
          } as FloatingDockItem,
          {
            title: 'Profil',
            icon: <User className="size-6" />,
            href: '/account',
            onClick: () => {
              router.push('/account');
              setMenuDrawerOpen(false);
            },
          } as FloatingDockItem,
        ]
      : [
          {
            title: 'Cennik',
            icon: <DollarSign className="size-6" />,
            href: '/pricing',
            onClick: () => {
              router.push('/pricing');
              setMenuDrawerOpen(false);
            },
          } as FloatingDockItem,
          {
            title: 'Zaloguj',
            icon: <User className="size-6" />,
            href: '/user-type-selection',
            onClick: () => {
              router.push('/user-type-selection');
              setMenuDrawerOpen(false);
            },
          } as FloatingDockItem,
        ]),
  ];

  const compactDockItems: FloatingDockItem[] = [
    {
      title: isMapExpanded ? 'Ukryj mapę' : 'Pokaż mapę',
      icon: <Map className="size-6" />,
      onClick: () => setIsMapExpanded(!isMapExpanded),
    },
    {
      title: 'Filtry',
      icon: <SlidersHorizontal className="size-6" />,
      onClick: () => setFiltersDrawerOpen(true),
    },
    {
      title: 'Menu',
      icon: <Menu className="size-6" />,
      onClick: () => setMenuDrawerOpen(true),
    },
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
                  const itemPath = getPathForLabel(item.title || '');
                  const active = itemPath ? isActive(itemPath) : false;
                  return (
                    <Button
                      key={index}
                      variant={active ? 'secondary' : 'ghost'}
                      className={`w-full justify-start ${active ? 'bg-primary/10 text-primary' : ''}`}
                      onClick={item.onClick}
                    >
                      <div className="h-4 w-4 mr-3">{item.icon}</div>
                      <span>{item.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Dock container - hidden when filters drawer is open, visible on mobile and tablet */}
        {!filtersDrawerOpen && (
          <div className="mobile-bottom-nav lg:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <FloatingDock
              items={compactDockItems}
              mobileClassName="lg:hidden"
            />
          </div>
        )}
      </>
    );
  }

  // Normal mode: Show all menu items - visible on mobile and tablet
  return (
    <div className="mobile-bottom-nav lg:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <FloatingDock
        items={menuItems}
        mobileClassName="lg:hidden"
      />
    </div>
  );
}
