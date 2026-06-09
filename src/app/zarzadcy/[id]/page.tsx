'use client';

import ManagerProfilePage from '../../../components/ManagerProfilePage';
import { useParams } from 'next/navigation';

export default function ManagerProfile() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ManagerProfilePage 
      managerId={id}
    />
  );
}
