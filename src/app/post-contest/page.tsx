'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import TenderCreationPage from '../../components/TenderCreationPage';

export default function PostContestPage() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent('/post-contest')}`);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <TenderCreationPage onBack={() => router.push('/manager-dashboard/konkursy')} />
  );
}
