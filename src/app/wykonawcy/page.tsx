'use client'

import ContractorBrowsePage from '../../components/ContractorBrowsePage';
import { useRouter } from 'next/navigation';

export default function Contractors() {
  const router = useRouter();

  return (
    <ContractorBrowsePage 
      onBack={() => router.push('/')}
      onContractorSelect={(contractorId: string) => router.push(`/contractors/${contractorId}`)}
    />
  );
}
