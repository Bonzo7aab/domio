'use client'

import { RegisterPage } from '../../components/RegisterPage';
import { useUserProfile } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Register() {
  const { user, isLoading } = useUserProfile();
  const router = useRouter();

  // Redirect to homepage if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Sprawdzanie...</p>
        </div>
      </div>
    );
  }

  // Don't render register page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <RegisterPage />
    </div>
  );
}
