'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterPage } from './RegisterPage';
import { useUserProfile } from '../contexts/AuthContext';
import type { RegistrationSettings } from '../lib/registration-settings-shared';

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="auth-loading">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface RegisterPageClientProps {
  registrationSettings: RegistrationSettings;
}

export function RegisterPageClient({ registrationSettings }: RegisterPageClientProps) {
  const { isAuthenticated, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingState label="Sprawdzanie..." />;
  }

  if (isAuthenticated) {
    return <LoadingState label="Przekierowywanie..." />;
  }

  return <RegisterPage registrationSettings={registrationSettings} />;
}
