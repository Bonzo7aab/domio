'use client';

import PostJobPage from '../../components/PostJobPage';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import { Suspense, useEffect, type ReactElement } from 'react';

function PostJobInner(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUserProfile();
  const from = searchParams.get('from');
  const jobId = searchParams.get('jobId');

  useEffect(() => {
    if (!isLoading && !user) {
      const q = new URLSearchParams();
      q.set('redirectTo', `/post-job${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
      router.push(`/login?${q.toString()}`);
    }
  }, [user, isLoading, router, searchParams]);

  const handleBack = (): void => {
    if (from === 'zgloszenia') {
      router.push('/manager-dashboard/zgloszenia');
      return;
    }
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground text-sm">Ładowanie…</p>
      </div>
    );
  }

  return <PostJobPage onBack={handleBack} jobId={jobId} />;
}

export default function PostJob(): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-muted-foreground text-sm">Ładowanie…</p>
        </div>
      }
    >
      <PostJobInner />
    </Suspense>
  );
}
