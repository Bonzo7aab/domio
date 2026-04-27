'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';

export default function PostTenderPage() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent('/post-job')}`);
      return;
    }

    if (!isLoading && user) {
      router.replace('/post-job');
    }
  }, [user, isLoading, router]);

  return null;
}
