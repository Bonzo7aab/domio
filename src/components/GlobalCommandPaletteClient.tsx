'use client';

import dynamic from 'next/dynamic';

// Dynamically import heavy components to reduce initial bundle size
export const GlobalCommandPaletteClient = dynamic(
  () => import('./GlobalCommandPalette').then(mod => ({ default: mod.GlobalCommandPalette })),
  { 
    ssr: false,
    loading: () => null // Command palette doesn't need loading state
  }
);
