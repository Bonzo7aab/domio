export interface Application {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  contractorCompany: string;
  contractorAvatar: string;
  contractorRating: number;
  contractorCompletedJobs: number;
  contractorLocation: string;
  proposedPrice: number;
  proposedTimeline: string;
  coverLetter: string;
  experience: string;
  teamSize: number;
  availableFrom: string;
  guaranteePeriod: string;
  attachments: Array<{
    id: string;
    name: string;
    type: 'portfolio' | 'reference' | 'certificate' | 'other';
    url: string;
    size: number;
  }>;
  certificates: string[];
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  submittedAt: Date;
  lastUpdated: Date;
  reviewNotes?: string;
}

export interface ApplicationAttachment {
  id: string;
  name: string;
  type: 'portfolio' | 'reference' | 'certificate' | 'other';
  url: string;
  size: number;
}

export type ApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';
