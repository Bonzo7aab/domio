'use client'

import ExpertConsultationPage from '../../components/ExpertConsultationPage';
import { useRouter } from 'next/navigation';

export default function ExpertConsultation() {
  const router = useRouter();

  return (
    <ExpertConsultationPage onBack={() => router.push('/')} />
  );
}
