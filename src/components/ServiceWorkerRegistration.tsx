'use client';

import { useServiceWorker } from '../hooks/useServiceWorker';
import { useEffect } from 'react';

/**
 * Client component to register service worker
 * This component should be included in the root layout
 */
export function ServiceWorkerRegistration() {
  const { registration, isSupported, isLoading, error } = useServiceWorker();

  useEffect(() => {
    if (error) {
      console.error('Service worker registration error:', error);
    }
  }, [error]);

  // This component doesn't render anything, it just handles service worker registration
  return null;
}

