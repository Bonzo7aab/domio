'use client';

import ContractorProfilePage from '../../../components/ContractorProfilePage';
import { useParams, useRouter } from 'next/navigation';

export default function ContractorProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const handleBack = () => {
    router.back();
  };

  return (
    <ContractorProfilePage 
      contractorId={id}
      onBack={handleBack}
    />
  );
}
