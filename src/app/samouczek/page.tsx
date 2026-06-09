'use client'

import { TutorialPage } from '../../components/TutorialPage';
import { useRouter } from 'next/navigation';

export default function Tutorial() {
  const router = useRouter();

  return (
    <TutorialPage 
      onBack={() => router.push('/')}
      onComplete={() => router.push('/')}
    />
  );
}
