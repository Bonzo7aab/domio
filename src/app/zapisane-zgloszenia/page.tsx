'use client'

import { BookmarkedJobsPage } from '../../components/BookmarkedJobsPage';
import { useRouter } from 'next/navigation';

export default function BookmarkedJobs() {
  const router = useRouter();

  return (
    <BookmarkedJobsPage 
      onBack={() => router.push('/')}
      onJobSelect={(jobId: string) => router.push(`/jobs/${jobId}`)}
    />
  );
}
