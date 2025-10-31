'use client'

import JobTypeSelectionPage from '../../components/JobTypeSelectionPage';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';

export default function JobTypeSelection() {
  const router = useRouter();
  const { user } = useUserProfile();

  return (
    <JobTypeSelectionPage 
      onBack={() => router.push('/')}
      onSelectJob={() => router.push('/post-job')}
      onSelectTender={() => {
        if (user?.userType === 'manager') {
          router.push('/tender-creation');
        } else {
          router.push('/login');
        }
      }}
      isAuthenticated={user?.userType === 'manager'}
      userType={user?.userType}
    />
  );
}
