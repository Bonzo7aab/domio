'use client';

import { useEffect, useState } from 'react';
import { isPushNotificationSupported, registerServiceWorker } from '../lib/push-notifications/client';

export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing service worker registration
 */
export function useServiceWorker(): ServiceWorkerState {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    // Register service worker
    const registerSW = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if service worker is already registered
        if ('serviceWorker' in navigator) {
          const existingRegistration = await navigator.serviceWorker.getRegistration();
          if (existingRegistration) {
            setRegistration(existingRegistration);
            setIsLoading(false);
            return;
          }
        }

        // Register new service worker
        const reg = await registerServiceWorker();
        setRegistration(reg);
      } catch (err) {
        console.error('Failed to register service worker:', err);
        setError(err instanceof Error ? err : new Error('Failed to register service worker'));
      } finally {
        setIsLoading(false);
      }
    };

    registerSW();

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            setRegistration(reg);
          }
        });
      });
    }
  }, []);

  return {
    registration,
    isSupported,
    isLoading,
    error
  };
}

