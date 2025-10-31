export interface ManagerProfile {
  id: string;
  name: string;
  organizationType: 'wspólnota' | 'spółdzielnia' | 'zarządca' | 'deweloper' | 'tbs' | 'administracja';
  avatar?: string;
  coverImage?: string;
  location: {
    city: string;
    district?: string;
    coordinates: { lat: number; lng: number };
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
    address: string;
    contactPerson: string;
    position: string;
  };
  businessInfo: {
    nip?: string;
    regon?: string;
    krs?: string;
    yearEstablished: number;
    legalForm: string;
  };
  rating: {
    overall: number;
    reviewsCount: number;
    categories: {
      paymentTimeliness: number;
      communication: number;
      projectClarity: number;
      professionalism: number;
    };
  };
  verification: {
    status: 'verified' | 'pending' | 'unverified';
    badges: string[];
    documents: string[];
    lastVerified?: string;
  };
  managedProperties: {
    buildingsCount: number;
    unitsCount: number;
    totalArea: number; // m²
    propertyTypes: string[];
    constructionYears: { min: number; max: number };
    averageUnitSize: number; // m²
  };
  services: {
    primaryNeeds: string[];
    frequentServices: string[];
    specialRequirements: string[];
  };
  experience: {
    yearsActive: number;
    publishedJobs: number;
    completedProjects: number;
    activeContractors: number;
    budgetRange: { min: number; max: number };
  };
  portfolio: {
    images: string[];
    managedBuildings: Array<{
      id: string;
      name: string;
      type: string;
      address: string;
      unitsCount: number;
      yearBuilt: number;
      images: string[];
      recentProjects: string[];
    }>;
  };
  financials: {
    averageProjectBudget: string;
    paymentTerms: string[];
    budgetPreferences: string;
    fundingSources: string[];
  };
  requirements: {
    requiredCertificates: string[];
    insuranceRequirements: string;
    preferredPaymentMethods: string[];
    workingHours: string;
    specialRequests: string[];
  };
  reviews: Array<{
    id: string;
    author: string;
    authorCompany: string;
    rating: number;
    date: string;
    project: string;
    comment: string;
    response?: string;
    helpful: number;
    projectBudget?: string;
  }>;
  stats: {
    averageResponseTime: string;
    paymentPunctuality: number;
    projectCompletionRate: number;
    contractorRetentionRate: number;
    averageProjectDuration: string;
  };
  preferences: {
    preferredContractorSize: string[];
    workSchedulePreference: string;
    communicationStyle: string;
    budgetFlexibility: string;
  };
  recentActivity: {
    lastJobPosted: string;
    totalJobsThisYear: number;
    averageJobsPerMonth: number;
    seasonalActivity: { [key: string]: number };
  };
  joinedDate: string;
  lastActive: string;
}
