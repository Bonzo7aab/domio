'use client';

import ManagerPage from '../../components/ManagerPage';
import { useRouter } from 'next/navigation';

export default function ManagerDashboard() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  const handlePostJob = () => {
    router.push('/post-job');
  };

  return (
    <ManagerPage 
      onBack={handleBack}
      onPostJob={handlePostJob}
    />
  );
}
