 'use client'

import { Suspense, useEffect } from 'react';
import React from 'react';
import { LoginPage } from '../../components/LoginPage';
import { useUserProfile } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { sanitizeRedirectPath } from '../../lib/auth/redirectPath';

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="auth-loading">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoadingState label="Ładowanie strony logowania..." />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { isAuthenticated, isLoading } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams?.get('redirectTo'), '/');

  // Redirect when session exists (middleware also handles full-page requests).
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading) {
    return <LoadingState label="Sprawdzanie..." />;
  }

  if (isAuthenticated) {
    return <LoadingState label="Przekierowywanie..." />;
  }

  return <LoginPage />;
}
