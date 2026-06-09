'use client'

import ManagerBrowsePage from '../../components/ManagerBrowsePage';
import { useRouter } from 'next/navigation';

export default function Managers() {
  const router = useRouter();

  return (
    <ManagerBrowsePage 
      onBack={() => router.push('/')}
      onManagerSelect={(managerId: string) => router.push(`/managers/${managerId}`)}
    />
  );
}
