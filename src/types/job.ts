export interface Job {
  id: string;
  postType: 'job' | 'tender';
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  postedTime: string;
  applications: number;
  rating: number;
  verified: boolean;
  urgent: boolean;
  category: string;
  subcategory: string;
  clientType: string;
  isPremium: boolean;
  hasInsurance: boolean;
  completedJobs: number;
  certificates: string[];
  deadline: string;
  budget: string;
  projectDuration: string;
  contractDetails: {
    contractType: string;
    paymentTerms: string;
    warrantyPeriod: string;
    terminationConditions: string;
  };
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  buildingType: string;
  buildingYear: number;
  surface: string;
  additionalInfo: string;
  companyLogo: string;
  images: string[];
  lat: number;
  lng: number;
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
