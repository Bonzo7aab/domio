'use client'

import { WelcomePage } from '../../components/WelcomePage';
import { useRouter } from 'next/navigation';

export default function Welcome() {
  const router = useRouter();

  return (
    <WelcomePage 
      onBack={() => router.push('/')}
      onGetStarted={() => router.push('/')}
      onTutorial={() => router.push('/tutorial')}
    />
  );
}
