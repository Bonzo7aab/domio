'use client';

import { useRouter } from 'next/navigation';
import TenderCreationPage from '../../components/TenderCreationPage';

export default function PostContestPage() {
  const router = useRouter();

  return (
    <TenderCreationPage onBack={() => router.push('/manager-dashboard/konkursy')} />
  );
}
