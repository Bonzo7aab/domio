'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UserTypeSelection() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to login page with tabs
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Przekierowywanie...</p>
      </div>
    </div>
  );
}
