import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchContractorApplications } from '../../../lib/database/contractors';
import { Card, CardContent } from '../../../components/ui/card';
import { ApplicationsContent } from './ApplicationsContent';

async function getApplicationsData(userId: string) {
  const supabase = await createClient();
  
  // Fetch company
  const { data: company } = await fetchUserPrimaryCompany(supabase, userId);
  if (!company) {
    return null;
  }

  // Fetch applications data
  const applicationsData = await fetchContractorApplications(supabase, company.id);

  // Map status from database format to component format
  const statusMap: Record<string, 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled'> = {
    'pending': 'submitted',
    'submitted': 'submitted',
    'under_review': 'under_review',
    'shortlisted': 'under_review',
    'reviewing': 'under_review',
    'accepted': 'accepted',
    'rejected': 'rejected',
    'cancelled': 'cancelled'
  };

  // Transform ContractorApplication to MyApplication format
  const transformedApplications = (applicationsData.applications || []).map(app => {
    const proposedPrice = typeof app.proposedPrice === 'string' 
      ? parseFloat(app.proposedPrice) || 0 
      : app.proposedPrice || 0;

    const transformedAttachments = (app.attachments || []).map((attachment: any, index: number) => {
      if (typeof attachment === 'string') {
        return {
          id: `attachment-${index}`,
          name: attachment.split('/').pop() || 'Załącznik',
          type: 'file',
          url: attachment
        };
      }
      return {
        id: attachment.id || `attachment-${index}`,
        name: attachment.name || attachment.filename || 'Załącznik',
        type: attachment.type || attachment.content_type || 'file',
        url: attachment.url || attachment.path || attachment.file_path || ''
      };
    });

    return {
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.jobTitle || 'Bez tytułu',
      jobCompany: app.companyName || 'Nieznana firma',
      jobLocation: app.jobLocation || 'Nieznana lokalizacja',
      jobCategory: app.jobCategory || 'Inne usługi',
      proposedPrice: proposedPrice,
      proposedTimeline: app.estimatedCompletion || 'Nie określono',
      status: statusMap[app.status] || 'submitted',
      submittedAt: new Date(app.appliedAt),
      lastUpdated: app.reviewedAt ? new Date(app.reviewedAt) : new Date(app.appliedAt),
      coverLetter: app.coverLetter || '',
      experience: app.experience || '',
      additionalNotes: app.notes || undefined,
      postedTime: app.postedTime || undefined,
      attachments: transformedAttachments,
      certificates: app.certificates || [],
      reviewNotes: app.notes || undefined,
      postType: 'job' as const
    };
  });

  // Transform ContractorBid to MyApplication format
  const transformedBids = (applicationsData.bids || []).map(bid => {
    const proposedPrice = typeof bid.bidAmount === 'string' 
      ? parseFloat(bid.bidAmount) || 0 
      : parseFloat(String(bid.bidAmount)) || 0;

    let proposedTimeline = 'Nie określono';
    if (bid.proposedTimeline) {
      const days = bid.proposedTimeline;
      if (days < 7) {
        proposedTimeline = `${days} ${days === 1 ? 'dzień' : 'dni'}`;
      } else if (days < 30) {
        const weeks = Math.round(days / 7);
        proposedTimeline = `${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'}`;
      } else {
        const months = Math.round(days / 30);
        proposedTimeline = `${months} ${months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}`;
      }
    }

    return {
      id: bid.id,
      jobId: bid.tenderId,
      jobTitle: bid.tenderTitle || 'Bez tytułu',
      jobCompany: bid.companyName || 'Nieznana firma',
      jobLocation: bid.location || 'Nieznana lokalizacja',
      jobCategory: bid.category || 'Przetarg',
      proposedPrice: proposedPrice,
      proposedTimeline: proposedTimeline,
      status: statusMap[bid.status] || 'submitted',
      submittedAt: new Date(bid.submittedAt),
      lastUpdated: bid.reviewedAt ? new Date(bid.reviewedAt) : new Date(bid.submittedAt),
      coverLetter: bid.technicalProposal || '',
      experience: '',
      postedTime: bid.postedTime || undefined,
      attachments: [],
      certificates: [],
      reviewNotes: undefined,
      postType: 'tender' as const
    };
  });

  // Combine applications and bids, sorted by submission date
  const allApplications = [...transformedApplications, ...transformedBids].sort((a, b) => 
    b.submittedAt.getTime() - a.submittedAt.getTime()
  );

  return {
    applications: allApplications,
    companyId: company.id,
  };
}

// Loading fallback component
function LoadingFallback({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-2 text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Async data fetcher component
async function ApplicationsDataFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const applicationsData = await getApplicationsData(user.id);

  if (!applicationsData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
        </CardContent>
      </Card>
    );
  }

  return <ApplicationsContent applications={applicationsData.applications} companyId={applicationsData.companyId} />;
}

// Page component - renders immediately
export default function ApplicationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={<LoadingFallback message="Ładowanie aplikacji..." />}>
        <ApplicationsDataFetcher />
      </Suspense>
    </div>
  );
}

