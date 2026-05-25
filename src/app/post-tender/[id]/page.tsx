'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserProfile } from '../../../contexts/AuthContext';
import TenderCreationPage from '../../../components/TenderCreationPage';

export default function PostTenderEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useUserProfile();
  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!isLoading && !user && id) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/post-tender/${id}`)}`);
    }
  }, [user, isLoading, router, id]);

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Nieprawidłowy identyfikator konkursu.</p>
      </div>
    );
  }

  if (isLoading || !user) {
    return null;
  }

  return (
    <TenderCreationPage
      tenderId={id}
      onBack={() => router.push('/manager-dashboard/zgloszenia?typ=przetarg')}
    />
  );
}
