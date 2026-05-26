'use client';

import { useState } from 'react';
import { cn } from '../../../components/ui/utils';
import { ContractorContestOffersContent } from '../../../components/contractor-dashboard/ContractorContestOffersContent';
import { ApplicationsContent } from './ApplicationsContent';
import type { ContractorContestOfferRow } from '../../../lib/database/contractor-contest-offers';

type Segment = 'konkursy' | 'zlecenia';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  jobCategory: string;
  proposedPrice: number;
  proposedTimeline: string;
  proposedTimelineDays?: number | null;
  vatRate?: 8 | 23;
  proposedStartDate?: string;
  availableFrom?: string;
  guaranteePeriodMonths?: number;
  teamSize?: number;
  tenderValidUntil?: string;
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

interface ApplicationsPageClientProps {
  contestOffers: ContractorContestOfferRow[];
  jobApplications: JobApplication[];
  companyId: string;
}

export function ApplicationsPageClient({
  contestOffers,
  jobApplications,
  companyId,
}: ApplicationsPageClientProps) {
  const [segment, setSegment] = useState<Segment>('konkursy');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setSegment('konkursy')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            segment === 'konkursy'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Konkursy ({contestOffers.length})
        </button>
        <button
          type="button"
          onClick={() => setSegment('zlecenia')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            segment === 'zlecenia'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Zlecenia ({jobApplications.length})
        </button>
      </div>

      {segment === 'konkursy' ? (
        <ContractorContestOffersContent offers={contestOffers} companyId={companyId} />
      ) : (
        <ApplicationsContent applications={jobApplications} companyId={companyId} />
      )}
    </div>
  );
}
