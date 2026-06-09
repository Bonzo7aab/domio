'use client'

import { ProfileCompletionWizard } from '../../components/ProfileCompletionWizard';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function ProfileCompletion() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.profileCompleted) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  if (user.profileCompleted) {
    return null;
  }

  return (
    <ProfileCompletionWizard 
      onBack={() => router.push('/')}
      onComplete={() => router.push('/')}
    />
  );
}
