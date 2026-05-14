export interface Application {
  id: string;
  jobId: string;
  contractorId: string;
  /** Contractor company id (for loading profile / OC in manager tools). */
  contractorCompanyId?: string;
  contractorName: string;
  contractorCompany: string;
  contractorAvatar: string;
  contractorRating: number;
  contractorCompletedJobs: number;
  contractorLocation: string;
  proposedPrice: number;
  proposedTimeline: string;
  /** Raw `proposed_timeline` from DB (days), when set. */
  timelineDays: number | null;
  /** Stored VAT rate percent (8 or 23). */
  vatRate: 8 | 23;
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
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
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

export type ApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
