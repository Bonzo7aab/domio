"use client";

import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { toast } from 'sonner';
import MyApplications from '../../../components/MyApplications';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  jobCategory: string;
  proposedPrice: number;
  proposedTimeline: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
  submittedAt: Date;
  lastUpdated: Date;
  coverLetter: string;
  experience: string;
  additionalNotes?: string;
  postedTime?: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  certificates: string[];
  reviewNotes?: string;
  postType: 'job' | 'tender';
}

interface ApplicationsContentProps {
  applications: Application[];
  companyId: string;
}

export function ApplicationsContent({ applications, companyId }: ApplicationsContentProps) {
  const router = useRouter();

  const handleJobView = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleStartConversation = async (applicationId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Musisz być zalogowany aby rozpocząć konwersację');
      return;
    }

    const application = applications.find(app => app.id === applicationId);
    if (!application) {
      toast.error('Nie znaleziono aplikacji');
      return;
    }

    try {
      const { getJobById, getTenderById } = await import('../../../lib/data');
      const { data: dbJob, error: jobError } = await getJobById(application.jobId);
      const { data: dbTender, error: tenderError } = await getTenderById(application.jobId);

      let managerId: string | null = null;
      if (dbJob && !jobError) {
        managerId = (dbJob as any).manager_id || null;
      } else if (dbTender && !tenderError) {
        managerId = (dbTender as any).manager_id || null;
      }

      if (!managerId) {
        toast.error('Nie można znaleźć zleceniodawcy');
        return;
      }

      const { findConversationByJob } = await import('../../../lib/database/messaging');
      const result = await findConversationByJob(
        supabase,
        application.jobId,
        user.id,
        managerId,
        application.postType === 'tender'
      );

      if (result.error) {
        console.error('Error checking for existing conversation:', result.error);
        router.push(`/messages?recipient=${managerId}&jobId=${application.jobId}`);
        return;
      }

      if (result.data) {
        router.push(`/messages?conversation=${result.data}`);
      } else {
        router.push(`/messages?recipient=${managerId}&jobId=${application.jobId}`);
      }
    } catch (error) {
      console.error('Error in handleStartConversation:', error);
      toast.error('Wystąpił błąd podczas sprawdzania konwersacji');
    }
  };

  const handleWithdrawApplication = async (applicationId: string, postType: 'job' | 'tender') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !companyId) {
      toast.error('Musisz być zalogowany aby anulować ofertę');
      return;
    }
    
    try {
      const { cancelJobApplication, cancelTenderBid } = await import('../../../lib/database/jobs');
      
      let result;
      if (postType === 'job') {
        result = await cancelJobApplication(supabase, applicationId, user.id);
      } else {
        result = await cancelTenderBid(supabase, applicationId, user.id);
      }

      if (result.error) {
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : result.error?.message || 'Wystąpił błąd podczas anulowania oferty';
        toast.error(errorMessage);
        return;
      }

      toast.success('Oferta została anulowana pomyślnie');
      
      // Refresh page to reload data
      router.refresh();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Wystąpił błąd podczas anulowania oferty');
    }
  };

  return (
    <MyApplications 
      applications={applications}
      loading={false}
      onJobView={handleJobView}
      onStartConversation={handleStartConversation}
      onWithdraw={handleWithdrawApplication}
    />
  );
}

