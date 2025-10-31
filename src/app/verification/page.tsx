'use client'

import { VerificationPage } from '../../components/VerificationPage';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function Verification() {
  const router = useRouter();
  const { user } = useUserProfile();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <VerificationPage onBack={() => router.push('/')} />
  );
}
