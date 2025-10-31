'use client'

import { ForgotPasswordPage } from '../../components/ForgotPasswordPage';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const router = useRouter();

  return (
    <ForgotPasswordPage 
      onBack={() => router.push('/')}
      onLoginClick={() => router.push('/user-type-selection')}
    />
  );
}
