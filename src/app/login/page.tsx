 'use client'

import { Suspense, useEffect } from 'react';
import { LoginPage } from '../../components/LoginPage';
import { useUserProfile } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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
  const { user, isLoading } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/';

  // Redirect to homepage if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingState label="Sprawdzanie..." />;
  }

  // Don't render login page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <LoginPage />
    </div>
  );
}
