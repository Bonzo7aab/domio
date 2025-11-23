import type { Budget, BudgetInput } from './budget';

export interface Job {
  // Core identifiers
  id: string;
  postType: 'job' | 'tender';
  
  // Basic info
  title: string;
  company: string; // Company name for display
  companyInfo?: {
    id: string;
    logo_url: string | null;
    is_verified: boolean;
  }; // Company details (use companyInfo.id instead of company_id, companyInfo.logo_url instead of company_logo)
  location: string | { city: string; sublocality_level_1?: string }; // Support both string and object formats
  type: string;
  description: string;
  postedTime: string;
  
  // Budget/Financial
  salary: string; // Display string for salary/budget
  budget: Budget; // Consolidated budget object with all budget fields
  // Legacy fields (deprecated - use budget.min/max/type/currency instead)
  /** @deprecated Use budget.min instead */
  budgetMin?: number;
  /** @deprecated Use budget.max instead */
  budgetMax?: number;
  /** @deprecated Use budget.type instead */
  budgetType?: 'fixed' | 'hourly' | 'negotiable' | 'range';
  /** @deprecated Use budget.currency instead */
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
