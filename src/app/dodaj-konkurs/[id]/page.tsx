'use client';

import { useParams, useRouter } from 'next/navigation';
import TenderCreationPage from '../../../components/TenderCreationPage';

export default function PostContestEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Nieprawidłowy identyfikator konkursu.</p>
      </div>
    );
  }

  return (
    <TenderCreationPage
      tenderId={id}
      onBack={() => router.push('/panel-zarzadcy/konkursy')}
    />
  );
}
