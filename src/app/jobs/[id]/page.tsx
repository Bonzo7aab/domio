'use client';

import JobPage from '../../../components/JobPage';
import { useParams, useRouter } from 'next/navigation';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const handleBack = () => {
    router.back();
  };

  const handleJobSelect = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  return (
    <JobPage 
      jobId={id} 
      onBack={handleBack}
      onJobSelect={handleJobSelect}
    />
  );
}
