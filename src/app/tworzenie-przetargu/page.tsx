'use client';

import TenderCreationPage from '../../components/TenderCreationPage';
import { useRouter } from 'next/navigation';

export default function TenderCreation() {
  const router = useRouter();

  return <TenderCreationPage onBack={() => router.push('/')} backLabel="Strona główna" />;
}
