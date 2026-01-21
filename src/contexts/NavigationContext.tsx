'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
  startNavigation: () => void;
  completeNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [_isNavigating, setIsNavigating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    
    // Clear any existing timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    
    // Show loader after 150ms delay to prevent flickering on fast navigations
    delayTimeoutRef.current = setTimeout(() => {
      setShowLoader(true);
    }, 150);
  }, []);

  const completeNavigation = useCallback(() => {
    // Clear delay timeout if navigation completes before delay
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    
    // Hide loader immediately
    setShowLoader(false);
    
    // Reset navigation state after a brief delay to allow fade-out animation
    setTimeout(() => {
      setIsNavigating(false);
    }, 200);
  }, []);

  // Track pathname changes to detect navigation completion
  useEffect(() => {
    if (previousPathnameRef.current !== null && previousPathnameRef.current !== pathname) {
      // Pathname changed, navigation completed
      // eslint-disable-next-line react-hooks/set-state-in-effect
      completeNavigation();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, completeNavigation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  const value: NavigationContextType = {
    isNavigating: showLoader, // Only show loader after delay
    startNavigation,
    completeNavigation,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
