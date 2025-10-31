'use client'

import PricingPage from '../../components/PricingPage';
import { useRouter } from 'next/navigation';

export default function Pricing() {
  const router = useRouter();

  return (
    <PricingPage 
      onBack={() => router.push('/')}
      onContractorRegister={() => router.push('/register?type=contractor')}
      onManagerRegister={() => router.push('/register?type=manager')}
      onExpertConsultation={() => router.push('/expert-consultation')}
    />
  );
}
