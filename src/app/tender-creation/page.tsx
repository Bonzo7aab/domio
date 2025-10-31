'use client';

import TenderCreationPage from '../../components/TenderCreationPage';
import { useRouter } from 'next/navigation';

export default function TenderCreation() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <TenderCreationPage onBack={handleBack} />
  );
}
