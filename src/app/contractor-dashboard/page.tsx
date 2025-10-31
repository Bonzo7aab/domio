'use client';

import ContractorPage from '../../components/ContractorPage';
import { useRouter } from 'next/navigation';

export default function ContractorDashboard() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  const handleBrowseJobs = () => {
    router.push('/');
  };

  return (
    <ContractorPage 
      onBack={handleBack}
      onBrowseJobs={handleBrowseJobs}
    />
  );
}
