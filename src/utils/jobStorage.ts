// Job storage utility for managing job postings in localStorage

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postType: 'job' | 'tender';
  salary: string;
  description: string;
  searchKeywords: string[];
  postedTime: string;
  applications: number;
  rating: number;
  verified: boolean;
  urgent: boolean;
  premium: boolean;
  hasInsurance: boolean;
  deadline: string;
  budget: string;
  category: string;
  subcategory: string;
  clientType: string;
  completedJobs: number;
  certificates: string[];
  distance?: number;
  popularity: number;
  salaryMin?: number;
  salaryMax?: number;
  budgetTotal?: number;
  lat?: number;
  lng?: number;
  tenderInfo?: {
    tenderType: string;
    phases: string[];
    currentPhase: string;
    wadium: string;
    evaluationCriteria: { name: string; weight: number }[];
    documentsRequired: string[];
    submissionDeadline: string;
    projectDuration: string;
  };
  // Additional fields from form
  address?: string;
  budgetType?: 'fixed' | 'hourly' | 'negotiable';
  urgency?: 'low' | 'medium' | 'high';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  organizationType?: string;
  organizationName?: string;
  requirements?: string;
  additionalInfo?: string;
}

const JOBS_STORAGE_KEY = 'urbi-jobs';

// Get coordinates for a city (simple mapping - in real app would use geocoding API)
const getCityCoordinates = (city: string): { lat: number; lng: number } => {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'warszawa': { lat: 52.2297, lng: 21.0122 },
    'kraków': { lat: 50.0647, lng: 19.9450 },
    'gdańsk': { lat: 54.3520, lng: 18.6466 },
    'wrocław': { lat: 51.1079, lng: 17.0385 },
    'poznań': { lat: 52.4064, lng: 16.9252 },
    'katowice': { lat: 50.2649, lng: 19.0238 }
  };
  
  const normalized = city.toLowerCase().replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z');
  return cityCoords[normalized] || { lat: 52.2297, lng: 21.0122 }; // Default to Warsaw
};

// Extract keywords from text
const extractKeywords = (title: string, description: string, category: string, subcategory: string): string[] => {
  const text = `${title} ${description} ${category} ${subcategory}`.toLowerCase();
  const keywords = new Set<string>();
  
  // Basic keyword extraction
  const words = text.split(/\s+/);
  words.forEach(word => {
    if (word.length > 3) {
      keywords.add(word);
    }
  });
  
  return Array.from(keywords).slice(0, 10); // Limit to 10 keywords
};

// Parse budget string to get min/max values
const parseBudget = (budget: string, budgetType: string): { salaryMin?: number; salaryMax?: number; budgetTotal?: number } => {
  const cleanBudget = budget.replace(/[^0-9-]/g, '');
  
  if (cleanBudget.includes('-')) {
    const [min, max] = cleanBudget.split('-').map(Number);
    return {
      salaryMin: min,
      salaryMax: max,
      budgetTotal: Math.round((min + max) / 2)
    };
  } else {
    const value = parseInt(cleanBudget);
    if (!isNaN(value)) {
      return {
        salaryMin: value,
        salaryMax: value,
        budgetTotal: value
      };
    }
  }
  
  return {};
};

// Convert form data to Job format
export const createJobFromFormData = (formData: any): Job => {
  const now = new Date();
  const coordinates = getCityCoordinates(formData.location);
  const keywords = extractKeywords(formData.title, formData.description, formData.category, formData.subcategory);
  const budgetInfo = parseBudget(formData.budget, formData.budgetType);
  
  const job: Job = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: formData.title,
    company: formData.organizationName || 'Organizacja',
    location: formData.location,
    type: getJobType(formData.category, formData.budgetType),
    postType: 'job',
    salary: formatSalary(formData.budget, formData.budgetType),
    description: formData.description,
    searchKeywords: keywords,
    postedTime: 'Właśnie teraz',
    applications: 0,
    rating: 4.5, // Default rating for new jobs
    verified: true,
    urgent: formData.urgency === 'high',
    premium: false,
    hasInsurance: true,
    deadline: formData.deadline || 'Do uzgodnienia',
    budget: formData.budget || 'Do negocjacji',
    category: formData.category,
    subcategory: formData.subcategory,
    clientType: formData.organizationType || 'Inne',
    completedJobs: 0,
    certificates: [],
    popularity: Math.floor(Math.random() * 50) + 1,
    lat: coordinates.lat,
    lng: coordinates.lng,
    // Form specific fields
    address: formData.address,
    budgetType: formData.budgetType,
    urgency: formData.urgency,
    contactName: formData.contactName,
    contactPhone: formData.contactPhone,
    contactEmail: formData.contactEmail,
    organizationType: formData.organizationType,
    organizationName: formData.organizationName,
    requirements: formData.requirements,
    additionalInfo: formData.additionalInfo,
    ...budgetInfo
  };
  
  return job;
};

// Helper function to determine job type based on category and budget type
const getJobType = (category: string, budgetType: string): string => {
  if (budgetType === 'hourly') return 'Zlecenie godzinowe';
  if (category.includes('Utrzymanie')) return 'Stały zleceniodawca';
  if (category.includes('Remontowo')) return 'Jednorazowe zlecenie';
  return 'Zlecenie okresowe';
};

// Helper function to format salary display
const formatSalary = (budget: string, budgetType: string): string => {
  if (!budget) return 'Do negocjacji';
  
  switch (budgetType) {
    case 'hourly':
      return `${budget} zł/h`;
    case 'fixed':
      return `${budget} zł`;
    default:
      return `${budget} zł (do negocjacji)`;
  }
};

// Save a new job to localStorage
export const saveJob = (job: Job): void => {
  try {
    const existingJobs = getStoredJobs();
    const updatedJobs = [job, ...existingJobs];
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
  } catch (error) {
    console.error('Error saving job:', error);
  }
};

// Get all stored jobs from localStorage
export const getStoredJobs = (): Job[] => {
  try {
    const stored = localStorage.getItem(JOBS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading jobs:', error);
    return [];
  }
};

// Clear all stored jobs
export const clearStoredJobs = (): void => {
  try {
    localStorage.removeItem(JOBS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing jobs:', error);
  }
};

// Get job by ID
export const getJobById = (id: string): Job | undefined => {
  const jobs = getStoredJobs();
  return jobs.find(job => job.id === id);
};

// Update job
export const updateJob = (id: string, updates: Partial<Job>): boolean => {
  try {
    const jobs = getStoredJobs();
    const index = jobs.findIndex(job => job.id === id);
    
    if (index !== -1) {
      jobs[index] = { ...jobs[index], ...updates };
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating job:', error);
    return false;
  }
};

// Delete job
export const deleteJob = (id: string): boolean => {
  try {
    const jobs = getStoredJobs();
    const filteredJobs = jobs.filter(job => job.id !== id);
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(filteredJobs));
    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    return false;
  }
};