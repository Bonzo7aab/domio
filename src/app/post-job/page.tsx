'use client';

import PostJobPage from '../../components/PostJobPage';
import { useRouter } from 'next/navigation';

export default function PostJob() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <PostJobPage onBack={handleBack} />
  );
}
