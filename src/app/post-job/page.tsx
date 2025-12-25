'use client';

import PostJobPage from '../../components/PostJobPage';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function PostJob() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login with return path
      router.push(`/login?redirectTo=${encodeURIComponent('/post-job')}`);
    }
  }, [user, isLoading, router]);

  const handleBack = () => {
    router.push('/');
  };

  // Show nothing while checking auth or if not authenticated (will redirect)
  if (isLoading || !user) {
    return null;
  }

  return (
    <PostJobPage onBack={handleBack} />
  );
}
