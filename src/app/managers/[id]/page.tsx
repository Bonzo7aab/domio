'use client';

import ManagerProfilePage from '../../../components/ManagerProfilePage';
import { useParams, useRouter } from 'next/navigation';

export default function ManagerProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const handleBack = () => {
    router.back();
  };

  return (
    <ManagerProfilePage 
      managerId={id}
      onBack={handleBack}
    />
  );
}
