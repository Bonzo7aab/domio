'use client';

import { useRouter } from 'next/navigation';
import { BookmarkedJobsPage } from '../../../components/BookmarkedJobsPage';

export default function ContractorFavoritesPage(): React.ReactElement {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BookmarkedJobsPage
        embedded
        onBack={() => router.push('/')}
        onJobSelect={(jobId) => router.push(`/zlecenia/${jobId}`)}
      />
    </div>
  );
}
