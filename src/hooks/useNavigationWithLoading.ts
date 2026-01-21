'use client';

import { useRouter } from 'next/navigation';
import { useNavigation } from '../contexts/NavigationContext';
import { useCallback } from 'react';

export function useNavigationWithLoading() {
  const router = useRouter();
  const { startNavigation } = useNavigation();

  const push = useCallback((href: string) => {
    startNavigation();
    router.push(href);
  }, [router, startNavigation]);

  const replace = useCallback((href: string) => {
    startNavigation();
    router.replace(href);
  }, [router, startNavigation]);

  const back = useCallback(() => {
    startNavigation();
    router.back();
  }, [router, startNavigation]);

  const forward = useCallback(() => {
    startNavigation();
    router.forward();
  }, [router, startNavigation]);

  const refresh = useCallback(() => {
    startNavigation();
    router.refresh();
  }, [router, startNavigation]);

  return {
    ...router,
    push,
    replace,
    back,
    forward,
    refresh,
  };
}
