'use client'

import { ProfileCompletionWizard } from '../../components/ProfileCompletionWizard';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function ProfileCompletion() {
  const router = useRouter();
  const { user } = useUserProfile();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <ProfileCompletionWizard 
      onBack={() => router.push('/')}
      onComplete={() => router.push('/')}
    />
  );
}
