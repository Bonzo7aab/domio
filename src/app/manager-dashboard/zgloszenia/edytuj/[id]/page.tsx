'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserProfile } from '../../../../../contexts/AuthContext';
import { useEffect, type ReactElement } from 'react';
import PostJobPage from '../../../../../components/PostJobPage';

export default function EdytujZgloszeniePage(): ReactElement {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useUserProfile();
  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/manager-dashboard/zgloszenia/edytuj/${id}`)}`);
    }
  }, [user, isLoading, router, id]);

  if (!id) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Nieprawidłowy identyfikator.</p>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Ładowanie…</p>
      </div>
    );
  }

  return (
    <PostJobPage
      jobId={id}
      onBack={() => {
        router.push('/manager-dashboard/zgloszenia');
      }}
    />
  );
}
