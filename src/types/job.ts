export interface Job {
  // Core identifiers
  id: string;
  postType: 'job' | 'tender';
  
  // Basic info
  title: string;
  company: string;
  location: string | { city: string; sublocality_level_1?: string }; // Support both string and object formats
  type: string;
  description: string;
  postedTime: string;
  
  // Budget/Financial
  salary: string;
  budget: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly' | 'negotiable' | 'range';
  currency?: string;
  
  // Requirements & Skills
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  
  // Metrics
  applications: number;
  visits_count?: number;
  bookmarks_count?: number;
  
  // Verification & Priority
  verified: boolean;
  urgent: boolean;
  urgency: 'low' | 'medium' | 'high';
  
  // Categorization
  category: string | { name: string; slug?: string };
  subcategory?: string;
  clientType?: string;
  
  // Premium features
  isPremium?: boolean;
  hasInsurance?: boolean;
  completedJobs?: number;
  certificates?: string[];
  
  // Timeline
  deadline?: string;
  projectDuration?: string;
  
  // Contract details (optional)
  contractDetails?: {
    contractType: string;
    paymentTerms: string;
    warrantyPeriod: string;
    terminationConditions: string;
  };
  
  // Contact info (optional)
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Building/Property details (optional)
  buildingType?: string;
  buildingYear?: number;
  surface?: string;
  additionalInfo?: string;
  
  // Media
  companyLogo?: string;
  images?: string[];
  
  // Location coordinates
  lat?: number;
  lng?: number;
  
  // Tender-specific info
  tenderInfo?: TenderInfo;
}

export interface TenderInfo {
  tenderType: string;
  phases: Array<{
    name: string;
    status: 'completed' | 'active' | 'pending';
    deadline: string;
  }>;
  currentPhase: string;
  wadium: string;
  evaluationCriteria: Array<{
    name: string;
    weight: number;
  }>;
  documentsRequired: string[];
  submissionDeadline: string;
  projectDuration: string;
  technicalSpecifications: {
    [key: string]: string | number;
  };
}

export type PostType = 'job' | 'tender';
export type TenderPhaseStatus = 'completed' | 'active' | 'pending';
