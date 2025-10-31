'use client'

import { UserAccountPageClient } from '../../components/UserAccountPageClient';
import { useRouter } from 'next/navigation';

export default function Account() {
  const router = useRouter();

  return (
    <UserAccountPageClient 
      onBack={() => router.push('/')} 
      onVerificationClick={() => router.push('/verification')}
      onManagerDashboardClick={() => router.push('/manager-dashboard')}
      onContractorDashboardClick={() => router.push('/contractor-dashboard')}
    />
  );
}
