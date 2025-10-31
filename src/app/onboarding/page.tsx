'use client'

import { useEffect } from 'react';
import { OnboardingFlow } from '../../components/OnboardingFlow';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('Onboarding - redirecting to login');
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <OnboardingFlow 
      onComplete={() => router.push('/')}
      onVerificationClick={() => router.push('/verification')}
    />
  );
}
