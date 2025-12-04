import { createClient } from '../supabase/client';
import { ContractorProfile } from '../../types/contractor';

// Re-export ContractorProfile for convenience
export type { ContractorProfile };

// Additional types for contractor dashboard
export interface ContractorApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected' | 'cancelled' | 'pending';
  appliedAt: string;
  proposedPrice?: string;
  estimatedCompletion?: string;
  coverLetter?: string;
  experience?: string;
  attachments?: any[];
  certificates?: string[];
  notes?: string;
  reviewedAt?: string;
  jobLocation?: string;
  jobCategory?: string;
  postedTime?: string; // When the job was posted (calculated from published_at or created_at)
}

export interface ContractorBid {
  id: string;
  tenderId: string;
  tenderTitle: string;
  companyName: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected' | 'cancelled' | 'pending'; // pending is legacy, use submitted
  bidAmount: string;
  submittedAt: string;
  validUntil: string;
  // Additional fields for applications view
  location?: string;
  category?: string;
  proposedTimeline?: number; // in days
  technicalProposal?: string;
  reviewedAt?: string;
  postedTime?: string; // When the tender was posted (calculated from published_at or created_at)
}

export interface ContractorStats {
  totalApplications: number;
  acceptedApplications: number;
  totalBids: number;
  acceptedBids: number;
  completedProjects: number;
  averageRating: number;
  totalEarnings: number;
  responseTime: string;
  onTimeCompletion: number;
}

export interface Certificate {
  id: string;
  name: string;
  type: string;
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  isVerified: boolean;
}

export interface ContractorDashboardData {
  profile: ContractorProfile;
  applications: ContractorApplication[];
  bids: ContractorBid[];
  stats: ContractorStats;
  certificates: Certificate[];
}

// Interface for browse page contractor data
export interface BrowseContractor {
  id: string;
  name: string;
  short_name?: string;
  city: string;
  avatar_url?: string;
  plan_type: 'basic' | 'pro' | 'premium';
  last_active: string;
  is_verified: boolean;
  verification_level: string;
  founded_year?: number;
  employee_count?: string;
  primary_services: string[];
  specializations: string[];
  service_area: string[];
  working_hours: string;
  availability_status: string;
  next_available: string;
  years_in_business: number;
  completed_projects: number;
  certifications: string[];
  hourly_rate_min: string;
  hourly_rate_max: string;
  price_range: string;
  has_oc: boolean;
  has_ac: boolean;
  oc_amount: string;
  ac_amount: string;
  response_time: string;
  on_time_completion: number;
  budget_accuracy: number;
  rehire_rate: number;
  rating: number;
  review_count: number;
}

export interface ContractorFilters {
  city?: string;
  category?: string;
  searchQuery?: string;
  sortBy?: 'rating' | 'jobs' | 'reviews' | 'name';
  limit?: number;
  offset?: number;
}

/**
 * Fetch contractors for the browse page with optional filtering
 */
export async function fetchContractors(filters: ContractorFilters = {}): Promise<BrowseContractor[]> {
  const supabase = createClient();
  
  const {
    city,
    category,
    searchQuery,
    sortBy = 'rating',
    limit = 50,
    offset = 0
  } = filters;

  try {
    let query = supabase
      .from('companies')
      .select(`
        id,
        name,
        city,
        logo_url,
        is_verified,
        verification_level,
        founded_year,
        employee_count,
        updated_at,
        description
      `)
      .eq('type', 'contractor')
      .eq('is_public', true); // Only show public profiles

    // Apply filters
    if (city) {
      query = query.eq('city', city);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Apply sorting (we'll sort after fetching ratings)
    // For now, just order by name as we'll sort by ratings/reviews after fetching the data
    query = query.order('name', { ascending: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contractors:', error);
      throw new Error('Failed to fetch contractors');
    }

    // Fetch ratings for all contractors
    const contractorIds = (data || []).map(company => company.id);
    let ratingsMap: { [key: string]: any } = {};
    
    if (contractorIds.length > 0) {
      const { data: ratingsData } = await (supabase as any)
        .from('company_ratings')
        .select('company_id, average_rating, total_reviews')
        .in('company_id', contractorIds);
      
      if (ratingsData) {
        ratingsMap = ratingsData.reduce((acc: any, rating: any) => {
          acc[rating.company_id] = rating;
          return acc;
        }, {});
      }
    }

    // Transform data to BrowseContractor format
    let contractors: BrowseContractor[] = (data || []).map(company => {
      const ratings = ratingsMap[company.id];
      
      return {
        id: company.id,
        name: company.name,
        short_name: company.name.split(' ')[0],
        city: company.city,
        avatar_url: company.logo_url,
        plan_type: 'basic',
        last_active: company.updated_at || new Date().toISOString(),
        is_verified: company.is_verified,
        verification_level: company.verification_level || 'basic',
        founded_year: company.founded_year,
        employee_count: company.employee_count || '1-5',
        primary_services: ['Budownictwo', 'Remonty'],
        specializations: ['Elewacje', 'Termomodernizacja'],
        service_area: [company.city || 'Warszawa'],
        working_hours: '8:00-16:00',
        availability_status: 'dostępny',
        next_available: new Date().toISOString(),
        years_in_business: company.founded_year ? new Date().getFullYear() - company.founded_year : 0,
        completed_projects: Math.floor(Math.random() * 200) + 10, // 10 to 210
        certifications: [],
        hourly_rate_min: '50',
        hourly_rate_max: '150',
        price_range: '50-150 PLN/h',
        has_oc: Math.random() > 0.5,
        has_ac: Math.random() > 0.7,
        oc_amount: '100000',
        ac_amount: '50000',
        response_time: '24h',
        on_time_completion: Math.floor(Math.random() * 20) + 80, // 80 to 100
        budget_accuracy: Math.floor(Math.random() * 20) + 80, // 80 to 100
        rehire_rate: Math.floor(Math.random() * 30) + 70, // 70 to 100
        rating: ratings?.average_rating || 0,
        review_count: ratings?.total_reviews || 0
      };
    });

    // Apply sorting after fetching ratings
    switch (sortBy) {
      case 'rating':
        contractors = contractors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'reviews':
        contractors = contractors.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'jobs':
        contractors = contractors.sort((a, b) => (b.completed_projects || 0) - (a.completed_projects || 0));
        break;
      case 'name':
      default:
        contractors = contractors.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return contractors;
  } catch (error) {
    console.error('Error in fetchContractors:', error);
    throw error;
  }
}

/**
 * Fetch a single contractor by ID with full profile data
 */
export async function fetchContractorById(id: string): Promise<ContractorProfile | null> {
  const supabase = createClient();

  try {
    // Fetch company data (don't filter by type to be more flexible)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (companyError || !company) {
      console.error('Error fetching contractor:', companyError);
      return null;
    }

    // Fetch real ratings data (use maybeSingle to handle missing records)
    const { data: ratingsData } = await (supabase as any)
      .from('company_ratings')
      .select('average_rating, total_reviews, rating_breakdown, category_ratings')
      .eq('company_id', id)
      .maybeSingle();

    // Transform to ContractorProfile format with real data
    const contractor: ContractorProfile = {
      id: company.id,
      name: company.name,
      companyName: company.name,
      companyType: 'sp_z_oo',
      avatar: company.logo_url,
      coverImage: '/api/placeholder/800/300',
      location: {
        city: company.city || 'Warszawa',
        district: company.city || 'Warszawa',
        coordinates: { lat: 52.2297, lng: 21.0122 }
      },
      contactInfo: {
        phone: company.phone || '',
        email: company.email || '',
        website: company.website,
        address: company.address || ''
      },
      businessInfo: {
        nip: company.nip || '',
        regon: company.regon || '',
        krs: company.krs,
        yearEstablished: company.founded_year || 2020,
        employeeCount: company.employee_count || '1-5'
      },
      rating: {
        overall: ratingsData?.average_rating || 0,
        reviewsCount: ratingsData?.total_reviews || 0,
        categories: {
          quality: ratingsData?.category_ratings?.quality || 0,
          timeliness: ratingsData?.category_ratings?.timeliness || 0,
          communication: ratingsData?.category_ratings?.communication || 0,
          pricing: ratingsData?.category_ratings?.pricing || 0
        }
      },
      verification: {
        status: company.is_verified ? 'verified' : 'unverified',
        badges: company.verification_level ? [company.verification_level] : [],
        documents: [],
        lastVerified: company.updated_at
      },
      services: {
        primary: ['Budownictwo', 'Remonty'],
        secondary: [],
        specializations: ['Elewacje', 'Termomodernizacja']
      },
      experience: {
        yearsInBusiness: company.founded_year ? new Date().getFullYear() - company.founded_year : 5,
        completedProjects: 0,
        projectTypes: {},
        certifications: []
      },
      portfolio: {
        images: ['/api/placeholder/400/300'],
        featuredProjects: []
      },
      pricing: {
        hourlyRate: { min: 50, max: 150 },
        projectBased: true,
        negotiable: true,
        paymentTerms: ['Zaliczka', 'Płatność etapowa', 'Faktura VAT']
      },
      availability: {
        status: 'dostępny',
        nextAvailable: new Date().toISOString(),
        workingHours: '8:00-16:00',
        serviceArea: [company.city || 'Warszawa']
      },
      insurance: {
        hasOC: false,
        ocAmount: '0',
        hasAC: false,
        acAmount: '0',
        validUntil: undefined
      },
      reviews: [],
      stats: {
        responseTime: '24h',
        onTimeCompletion: 0,
        budgetAccuracy: 0,
        rehireRate: 0
      },
      plan: 'basic',
      joinedDate: company.created_at,
      lastActive: company.updated_at
    };

    return contractor;
  } catch (error) {
    console.error('Error in fetchContractorById:', error);
    throw error;
  }
}


/**
 * Fetch contractor dashboard data
 */
export async function fetchContractorDashboardData(supabase: any, contractorId: string): Promise<ContractorDashboardData> {
  try {
    // Fetch contractor profile
    const profile = await fetchContractorById(contractorId);
    if (!profile) {
      throw new Error('Contractor not found');
    }

    // Fetch applications with complete job details
    const { data: applications } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        proposed_price,
        proposed_timeline,
        cover_letter,
        experience,
        attachments,
        certificates,
        notes,
        reviewed_at,
        status,
        submitted_at,
        jobs (
          title,
          location,
          companies (
            name
          ),
          job_categories (
            name
          )
        )
      `)
      .eq('company_id', contractorId)
      .order('submitted_at', { ascending: false });

    // Helper function to convert days to readable format
    const formatTimeline = (days: number | null | undefined): string | undefined => {
      if (!days) return undefined;
      if (days < 7) return `${days} ${days === 1 ? 'dzień' : 'dni'}`;
      if (days < 30) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        if (remainingDays === 0) {
          return `${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'}`;
        }
        return `${weeks} ${weeks === 1 ? 'tydzień' : 'tygodnie'} ${remainingDays} ${remainingDays === 1 ? 'dzień' : 'dni'}`;
      }
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return `${months} ${months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}`;
      }
      return `${months} ${months === 1 ? 'miesiąc' : 'miesiące'} ${remainingDays} ${remainingDays === 1 ? 'dzień' : 'dni'}`;
    };

    const formattedApplications: ContractorApplication[] = applications?.map(app => ({
      id: app.id,
      jobId: app.job_id,
      jobTitle: app.jobs?.title || '',
      companyName: app.jobs?.companies?.name || '',
      status: app.status || 'pending',
      appliedAt: app.submitted_at,
      proposedPrice: app.proposed_price,
      estimatedCompletion: formatTimeline(app.proposed_timeline),
      coverLetter: app.cover_letter,
      experience: app.experience || '',
      attachments: app.attachments || [],
      certificates: app.certificates || [],
      notes: app.notes || undefined,
      reviewedAt: app.reviewed_at || undefined,
      jobLocation: typeof app.jobs?.location === 'string' 
        ? app.jobs.location 
        : app.jobs?.location?.city || 'Nieznana lokalizacja',
      jobCategory: app.jobs?.job_categories?.name || 'Inne usługi'
    })) || [];

    // Fetch bids with more details for applications view
    const { data: bids } = await supabase
      .from('tender_bids')
      .select(`
        id,
        tender_id,
        bid_amount,
        proposed_timeline,
        technical_proposal,
        status,
        submitted_at,
        evaluated_at,
        valid_until,
        tenders (
          title,
          location,
          job_categories (
            name
          ),
          companies (
            name
          )
        )
      `)
      .eq('company_id', contractorId)
      .order('submitted_at', { ascending: false });

    const formattedBids: ContractorBid[] = bids?.map(bid => ({
      id: bid.id,
      tenderId: bid.tender_id,
      tenderTitle: bid.tenders?.title || '',
      companyName: bid.tenders?.companies?.name || '',
      status: bid.status || 'pending',
      bidAmount: bid.bid_amount || '',
      submittedAt: bid.submitted_at,
      validUntil: bid.valid_until || '',
      location: typeof bid.tenders?.location === 'string' 
        ? bid.tenders.location 
        : bid.tenders?.location?.city || 'Nieznana lokalizacja',
      category: bid.tenders?.job_categories?.name || 'Przetarg',
      proposedTimeline: bid.proposed_timeline || undefined,
      technicalProposal: bid.technical_proposal || undefined,
      reviewedAt: bid.evaluated_at || undefined // Use evaluated_at for tender_bids
    })) || [];

    // Fetch certificates
    const { data: certificates } = await supabase
      .from('certificates')
      .select('*')
      .eq('company_id', contractorId);

    const formattedCertificates: Certificate[] = certificates?.map(cert => ({
      id: cert.id,
      name: cert.name,
      type: cert.type,
      number: cert.number,
      issuer: cert.issuer,
      issueDate: cert.issue_date,
      expiryDate: cert.expiry_date,
      isVerified: cert.is_verified
    })) || [];

    // Calculate stats
    const stats: ContractorStats = {
      totalApplications: formattedApplications.length,
      acceptedApplications: formattedApplications.filter(app => app.status === 'accepted').length,
      totalBids: formattedBids.length,
      acceptedBids: formattedBids.filter(bid => bid.status === 'accepted').length,
      completedProjects: profile.experience.completedProjects,
      averageRating: profile.rating.overall,
      totalEarnings: 0, // Would need to calculate from completed projects
      responseTime: profile.stats.responseTime,
      onTimeCompletion: profile.stats.onTimeCompletion
    };

    return {
      profile,
      applications: formattedApplications,
      bids: formattedBids,
      stats,
      certificates: formattedCertificates
    };
  } catch (error) {
    console.error('Error fetching contractor dashboard data:', error);
    throw error;
  }
}

/**
 * Fetch contractor dashboard stats (for dashboard tab)
 */
export async function fetchContractorDashboardStats(
  supabase: any,
  contractorId: string
): Promise<{ profile: ContractorProfile; stats: ContractorStats }> {
  try {
    // Fetch contractor profile
    const profile = await fetchContractorById(contractorId);
    if (!profile) {
      throw new Error('Contractor not found');
    }

    // Fetch applications count for stats
    const { count: applicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId);

    const { count: acceptedApplicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId)
      .eq('status', 'accepted');

    // Fetch bids count for stats
    const { count: bidsCount } = await supabase
      .from('tender_bids')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId);

    const { count: acceptedBidsCount } = await supabase
      .from('tender_bids')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId)
      .eq('status', 'accepted');

    // Calculate stats
    const stats: ContractorStats = {
      totalApplications: applicationsCount || 0,
      acceptedApplications: acceptedApplicationsCount || 0,
      totalBids: bidsCount || 0,
      acceptedBids: acceptedBidsCount || 0,
      completedProjects: profile.experience.completedProjects,
      averageRating: profile.rating.overall,
      totalEarnings: 0, // Would need to calculate from completed projects
      responseTime: profile.stats.responseTime,
      onTimeCompletion: profile.stats.onTimeCompletion
    };

    return { profile, stats };
  } catch (error) {
    console.error('Error fetching contractor dashboard stats:', error);
    throw error;
  }
}

/**
 * Fetch contractor applications and bids (for applications tab)
 */
export async function fetchContractorApplications(
  supabase: any,
  contractorId: string
): Promise<{ applications: ContractorApplication[]; bids: ContractorBid[] }> {
  try {
    // Helper function to convert days to readable format
    const formatTimeline = (days: number | null | undefined): string | undefined => {
      if (!days) return undefined;
      if (days < 7) return `${days} ${days === 1 ? 'dzień' : 'dni'}`;
      if (days < 30) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        if (remainingDays === 0) {
          return `${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'}`;
        }
        return `${weeks} ${weeks === 1 ? 'tydzień' : 'tygodnie'} ${remainingDays} ${remainingDays === 1 ? 'dzień' : 'dni'}`;
      }
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return `${months} ${months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}`;
      }
      return `${months} ${months === 1 ? 'miesiąc' : 'miesiące'} ${remainingDays} ${remainingDays === 1 ? 'dzień' : 'dni'}`;
    };

    // Helper function to convert date to "time ago" format
    const getTimeAgo = (date: string | null | undefined): string | undefined => {
      if (!date) return undefined;
      const now = new Date();
      const past = new Date(date);
      const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Przed chwilą';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dni temu`;
      
      return past.toLocaleDateString('pl-PL');
    };

    // Fetch applications with complete job details
    const { data: applications } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        proposed_price,
        proposed_timeline,
        cover_letter,
        experience,
        attachments,
        certificates,
        notes,
        reviewed_at,
        status,
        submitted_at,
        jobs (
          title,
          location,
          published_at,
          created_at,
          companies (
            name
          ),
          job_categories (
            name
          )
        )
      `)
      .eq('company_id', contractorId)
      .order('submitted_at', { ascending: false });

    const formattedApplications: ContractorApplication[] = applications?.map(app => ({
      id: app.id,
      jobId: app.job_id,
      jobTitle: app.jobs?.title || '',
      companyName: app.jobs?.companies?.name || '',
      status: app.status || 'pending',
      appliedAt: app.submitted_at,
      proposedPrice: app.proposed_price,
      estimatedCompletion: formatTimeline(app.proposed_timeline),
      coverLetter: app.cover_letter,
      experience: app.experience || '',
      attachments: app.attachments || [],
      certificates: app.certificates || [],
      notes: app.notes || undefined,
      reviewedAt: app.reviewed_at || undefined,
      jobLocation: typeof app.jobs?.location === 'string' 
        ? app.jobs.location 
        : app.jobs?.location?.city || 'Nieznana lokalizacja',
      jobCategory: app.jobs?.job_categories?.name || 'Inne usługi',
      postedTime: getTimeAgo(app.jobs?.published_at || app.jobs?.created_at)
    })) || [];

    // Fetch bids with more details for applications view
    const { data: bids } = await supabase
      .from('tender_bids')
      .select(`
        id,
        tender_id,
        bid_amount,
        proposed_timeline,
        technical_proposal,
        status,
        submitted_at,
        evaluated_at,
        valid_until,
        tenders (
          title,
          location,
          published_at,
          created_at,
          job_categories (
            name
          ),
          companies (
            name
          )
        )
      `)
      .eq('company_id', contractorId)
      .order('submitted_at', { ascending: false });

    const formattedBids: ContractorBid[] = bids?.map(bid => ({
      id: bid.id,
      tenderId: bid.tender_id,
      tenderTitle: bid.tenders?.title || '',
      companyName: bid.tenders?.companies?.name || '',
      status: bid.status || 'pending',
      bidAmount: bid.bid_amount || '',
      submittedAt: bid.submitted_at,
      validUntil: bid.valid_until || '',
      location: typeof bid.tenders?.location === 'string' 
        ? bid.tenders.location 
        : bid.tenders?.location?.city || 'Nieznana lokalizacja',
      category: bid.tenders?.job_categories?.name || 'Przetarg',
      proposedTimeline: bid.proposed_timeline || undefined,
      technicalProposal: bid.technical_proposal || undefined,
      reviewedAt: bid.evaluated_at || undefined,
      postedTime: getTimeAgo(bid.tenders?.published_at || bid.tenders?.created_at)
    })) || [];

    return {
      applications: formattedApplications,
      bids: formattedBids
    };
  } catch (error) {
    console.error('Error fetching contractor applications:', error);
    throw error;
  }
}

/**
 * Fetch contractor analytics data (for analytics tab)
 */
export async function fetchContractorAnalytics(
  supabase: any,
  contractorId: string
): Promise<{ stats: ContractorStats; ratingSummary: Awaited<ReturnType<typeof fetchContractorRatingSummary>> }> {
  try {
    // Fetch contractor profile for stats
    const profile = await fetchContractorById(contractorId);
    if (!profile) {
      throw new Error('Contractor not found');
    }

    // Fetch applications count for stats
    const { count: applicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId);

    const { count: acceptedApplicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId)
      .eq('status', 'accepted');

    // Fetch bids count for stats
    const { count: bidsCount } = await supabase
      .from('tender_bids')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId);

    const { count: acceptedBidsCount } = await supabase
      .from('tender_bids')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', contractorId)
      .eq('status', 'accepted');

    // Calculate stats
    const stats: ContractorStats = {
      totalApplications: applicationsCount || 0,
      acceptedApplications: acceptedApplicationsCount || 0,
      totalBids: bidsCount || 0,
      acceptedBids: acceptedBidsCount || 0,
      completedProjects: profile.experience.completedProjects,
      averageRating: profile.rating.overall,
      totalEarnings: 0,
      responseTime: profile.stats.responseTime,
      onTimeCompletion: profile.stats.onTimeCompletion
    };

    // Fetch rating summary
    const ratingSummary = await fetchContractorRatingSummary(contractorId);

    return { stats, ratingSummary };
  } catch (error) {
    console.error('Error fetching contractor analytics:', error);
    throw error;
  }
}

/**
 * Fetch completed projects for contractor
 */
export async function fetchCompletedProjects(supabase: any, contractorId: string, limit: number = 10): Promise<any[]> {
  try {
    const { data: projects } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        title,
        description,
        budget_range,
        duration,
        completion_date,
        client_name,
        client_feedback,
        is_featured,
        portfolio_project_images (
          file_uploads (
            file_path
          )
        )
      `)
      .eq('company_id', contractorId)
      .order('completion_date', { ascending: false })
      .limit(limit);

    return projects || [];
  } catch (error) {
    console.error('Error fetching completed projects:', error);
    throw error;
  }
}

/**
 * Fetch platform project history for contractor (completed jobs where application was accepted)
 */
export interface PlatformProject {
  id: string;
  applicationId: string;
  jobId: string;
  title: string;
  description: string;
  location: string;
  clientCompany: string;
  clientCompanyId: string;
  budget?: number;
  budgetMax?: number;
  proposedPrice?: number;
  currency: string;
  completionDate?: string;
  appliedAt: string;
  decisionAt?: string;
  duration?: string;
  category?: string;
}

export async function fetchPlatformProjectHistory(
  supabase: any,
  companyId: string,
  limit: number = 50
): Promise<PlatformProject[]> {
  try {
    // Query job_applications with accepted status, join with jobs
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        proposed_price,
        currency,
        submitted_at,
        decision_at,
        jobs!inner (
          id,
          title,
          description,
          location,
          budget_min,
          budget_max,
          currency,
          project_duration,
          updated_at,
          status,
          companies (
            id,
            name
          ),
          job_categories (
            name
          )
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'accepted')
      .order('decision_at', { ascending: false })
      .limit(limit * 2); // Fetch more to filter for completed jobs

    if (error) {
      console.error('Error fetching platform project history:', error);
      throw error;
    }

    if (!applications || applications.length === 0) {
      return [];
    }

    // Transform the data to PlatformProject format, filtering for completed jobs
    const projects: PlatformProject[] = applications
      .filter((app: any) => app.jobs && app.jobs.status === 'completed') // Filter for completed jobs only
      .slice(0, limit) // Limit to requested amount
      .map((app: any) => ({
        id: app.job_id,
        applicationId: app.id,
        jobId: app.job_id,
        title: app.jobs.title || 'Bez tytułu',
        description: app.jobs.description || '',
        location: app.jobs.location || '',
        clientCompany: app.jobs.companies?.name || 'Nieznana firma',
        clientCompanyId: app.jobs.companies?.id || '',
        budget: app.jobs.budget_min || undefined,
        budgetMax: app.jobs.budget_max || undefined,
        proposedPrice: app.proposed_price || undefined,
        currency: app.currency || app.jobs.currency || 'PLN',
        completionDate: app.jobs.updated_at || undefined, // Use updated_at as completion date approximation
        appliedAt: app.submitted_at,
        decisionAt: app.decision_at || undefined,
        duration: app.jobs.project_duration || undefined,
        category: app.jobs.job_categories?.name || undefined,
      }));

    return projects;
  } catch (error) {
    console.error('Error in fetchPlatformProjectHistory:', error);
    throw error;
  }
}

/**
 * Fetch contractor reviews with pagination
 */
export async function fetchContractorReviews(
  contractorId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<Array<{
  id: string;
  reviewerName: string;
  reviewerType: string;
  rating: number;
  title: string;
  comment: string;
  categories: {
    quality: number;
    timeliness: number;
    communication: number;
    pricing: number;
  };
  createdAt: string;
  helpfulCount: number;
}>> {
  const supabase = createClient();

  try {
    const { data, error } = await (supabase as any)
      .from('company_reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        categories,
        created_at,
        user_profiles!company_reviews_reviewer_id_fkey (
          first_name,
          last_name,
          user_type
        )
      `)
      .eq('company_id', contractorId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching contractor reviews:', error);
      throw new Error('Failed to fetch contractor reviews');
    }

    return (data || []).map((review: any) => ({
      id: review.id,
      reviewerName: review.user_profiles ? 
        `${review.user_profiles.first_name} ${review.user_profiles.last_name}` : 
        'Anonimowy użytkownik',
      reviewerType: review.user_profiles?.user_type || 'manager',
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      categories: review.categories || {
        quality: 0,
        timeliness: 0,
        communication: 0,
        pricing: 0
      },
      createdAt: review.created_at,
      helpfulCount: 0 // Placeholder for helpful votes
    }));
  } catch (error) {
    console.error('Error in fetchContractorReviews:', error);
    throw error;
  }
}

/**
 * Fetch contractor rating summary
 */
export async function fetchContractorRatingSummary(contractorId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  categoryRatings: {
    quality: number;
    timeliness: number;
    communication: number;
    pricing: number;
  };
  lastReviewDate: string | null;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await (supabase as any)
      .from('company_ratings')
      .select(`
        average_rating,
        total_reviews,
        rating_breakdown,
        category_ratings,
        last_review_date
      `)
      .eq('company_id', contractorId)
      .maybeSingle();

    // Return default values if no ratings exist yet
    if (error) {
      console.log('No ratings found for contractor:', contractorId);
    }

    return {
      averageRating: data?.average_rating || 0,
      totalReviews: data?.total_reviews || 0,
      ratingBreakdown: data?.rating_breakdown || {
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0
      },
      categoryRatings: data?.category_ratings || {
        quality: 0,
        timeliness: 0,
        communication: 0,
        pricing: 0
      },
      lastReviewDate: data?.last_review_date || null
    };
  } catch (error) {
    console.error('Error in fetchContractorRatingSummary:', error);
    throw error;
  }
}

/**
 * Create a review for a contractor
 */
export async function createContractorReview(
  supabase: any,
  contractorId: string,
  reviewerId: string,
  reviewData: {
    rating: number;
    title?: string;
    comment?: string;
    categories?: {
      quality?: number;
      timeliness?: number;
      communication?: number;
      pricing?: number;
    };
    jobId?: string;
    tenderId?: string;
  }
): Promise<{ data: any; error: Error | null }> {
  try {
    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      return { data: null, error: new Error('Rating must be between 1 and 5') };
    }

    // Check if reviewer already reviewed this contractor
    const { data: existingReview } = await supabase
      .from('company_reviews')
      .select('id')
      .eq('company_id', contractorId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();

    if (existingReview) {
      return { data: null, error: new Error('You have already reviewed this contractor') };
    }

    // Insert review
    const { data, error } = await supabase
      .from('company_reviews')
      .insert({
        company_id: contractorId,
        reviewer_id: reviewerId,
        rating: reviewData.rating,
        title: reviewData.title || null,
        comment: reviewData.comment || null,
        categories: reviewData.categories || null,
        job_id: reviewData.jobId || null,
        tender_id: reviewData.tenderId || null,
        is_public: true,
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return { data: null, error: new Error('Failed to create review') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createContractorReview:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

/**
 * Get top rated contractors with enhanced data
 */
export async function getTopRatedContractors(limit: number = 5): Promise<BrowseContractor[]> {
  return fetchContractors({ sortBy: 'rating', limit });
}

/**
 * Get contractors by city with enhanced data
 */
export async function getContractorsByCity(city: string): Promise<BrowseContractor[]> {
  return fetchContractors({ city, limit: 50 });
}

/**
 * Get contractors by service category with enhanced data
 */
export async function getContractorsByService(service: string): Promise<BrowseContractor[]> {
  return fetchContractors({ category: service, limit: 50 });
}

/**
 * Search contractors by query with enhanced data
 */
export async function searchContractors(query: string): Promise<BrowseContractor[]> {
  return fetchContractors({ searchQuery: query, limit: 50 });
}

/**
 * Fetch a single portfolio project by ID with full details
 */
export async function fetchPortfolioProjectById(
  supabase: any,
  projectId: string
): Promise<{
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  projectType?: string;
  budget?: string;
  duration?: string;
  completionDate?: string;
  clientName?: string;
  clientFeedback?: string;
  isFeatured?: boolean;
  images?: string[];
} | null> {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        title,
        description,
        location,
        project_type,
        budget_range,
        duration,
        completion_date,
        client_name,
        client_feedback,
        is_featured,
        job_categories (
          name
        ),
        portfolio_project_images (
          file_uploads (
            file_path
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !data) {
      console.error('Error fetching portfolio project:', error);
      return null;
    }

    // Convert file paths to public URLs
    const imageUrls = (data.portfolio_project_images || []).map((img: any) => {
      const filePath = img.file_uploads?.file_path;
      if (!filePath) return null;
      
      if (filePath.startsWith('http')) {
        return filePath;
      }
      
      const supabaseClient = createClient();
      const { data: urlData } = supabaseClient.storage
        .from('job-attachments')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    }).filter(Boolean) as string[];

    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      category: data.job_categories?.name || undefined,
      location: data.location || undefined,
      projectType: data.project_type || undefined,
      budget: data.budget_range || undefined,
      duration: data.duration || undefined,
      completionDate: data.completion_date ? new Date(data.completion_date).toISOString().split('T')[0] : undefined,
      clientName: data.client_name || undefined,
      clientFeedback: data.client_feedback || undefined,
      isFeatured: data.is_featured || false,
      images: imageUrls
    };
  } catch (error) {
    console.error('Error in fetchPortfolioProjectById:', error);
    return null;
  }
}

/**
 * Fetch portfolio projects for a contractor
 */
export async function fetchContractorPortfolio(contractorId: string): Promise<Array<{
  id: string;
  title: string;
  description: string;
  images: string[];
  budget: string;
  duration: string;
  year: number;
  category: string;
  location: string;
  projectType: string;
  clientName: string;
  clientFeedback: string;
  isFeatured: boolean;
}>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        title,
        description,
        location,
        project_type,
        budget_range,
        duration,
        completion_date,
        client_name,
        client_feedback,
        is_featured,
        portfolio_project_images (
          file_uploads (
            file_path
          )
        ),
        job_categories (
          name
        )
      `)
      .eq('company_id', contractorId)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching contractor portfolio:', error);
      throw new Error('Failed to fetch contractor portfolio');
    }

    return (data || []).map(project => {
      // Convert file paths to public URLs
      const imageUrls = (project.portfolio_project_images || []).map(img => {
        const filePath = img.file_uploads?.file_path;
        if (!filePath) return null;
        
        // If it's already a URL, return it
        if (filePath.startsWith('http')) {
          return filePath;
        }
        
        // Otherwise, convert storage path to public URL
        const supabase = createClient();
        const { data: urlData } = supabase.storage
          .from('job-attachments')
          .getPublicUrl(filePath);
        
        return urlData.publicUrl;
      }).filter(Boolean) as string[];

      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        images: imageUrls,
        budget: project.budget_range || '',
        duration: project.duration || '',
        year: project.completion_date ? new Date(project.completion_date).getFullYear() : new Date().getFullYear(),
        category: project.job_categories?.name || '',
        location: project.location || '',
        projectType: project.project_type || '',
        clientName: project.client_name || '',
        clientFeedback: project.client_feedback || '',
        isFeatured: project.is_featured
      };
    });
  } catch (error) {
    console.error('Error in fetchContractorPortfolio:', error);
    throw error;
  }
}

/**
 * Fetch featured portfolio projects for a contractor (limited to 6)
 */
export async function fetchContractorFeaturedPortfolio(contractorId: string, limit: number = 6): Promise<Array<{
  id: string;
  title: string;
  description: string;
  images: string[];
  budget: string;
  duration: string;
  year: number;
  category: string;
  location: string;
  projectType: string;
  clientName: string;
  clientFeedback: string;
  isFeatured: boolean;
}>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        title,
        description,
        location,
        project_type,
        budget_range,
        duration,
        completion_date,
        client_name,
        client_feedback,
        is_featured,
        portfolio_project_images (
          file_uploads (
            file_path
          )
        ),
        job_categories (
          name
        )
      `)
      .eq('company_id', contractorId)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching contractor featured portfolio:', error);
      throw new Error('Failed to fetch contractor featured portfolio');
    }

    return (data || []).map(project => {
      // Convert file paths to public URLs
      const imageUrls = (project.portfolio_project_images || []).map(img => {
        const filePath = img.file_uploads?.file_path;
        if (!filePath) return null;
        
        // If it's already a URL, return it
        if (filePath.startsWith('http')) {
          return filePath;
        }
        
        // Otherwise, convert storage path to public URL
        const supabase = createClient();
        const { data: urlData } = supabase.storage
          .from('job-attachments')
          .getPublicUrl(filePath);
        
        return urlData.publicUrl;
      }).filter(Boolean) as string[];

      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        images: imageUrls,
        budget: project.budget_range || '',
        duration: project.duration || '',
        year: project.completion_date ? new Date(project.completion_date).getFullYear() : new Date().getFullYear(),
        category: project.job_categories?.name || '',
        location: project.location || '',
        projectType: project.project_type || '',
        clientName: project.client_name || '',
        clientFeedback: project.client_feedback || '',
        isFeatured: project.is_featured
      };
    });
  } catch (error) {
    console.error('Error in fetchContractorFeaturedPortfolio:', error);
    throw error;
  }
}

/**
 * Portfolio project data for create/update
 */
export interface PortfolioProjectInput {
  title: string;
  description?: string;
  categoryId?: string;
  location?: string;
  projectType?: string;
  budgetRange?: string;
  duration?: string;
  completionDate?: string;
  clientName?: string;
  clientFeedback?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}

/**
 * Create a new portfolio project
 */
export async function createPortfolioProject(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  projectData: PortfolioProjectInput
): Promise<{ data: string | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .insert({
        company_id: companyId,
        title: projectData.title,
        description: projectData.description || null,
        category_id: projectData.categoryId || null,
        location: projectData.location || null,
        project_type: projectData.projectType || null,
        budget_range: projectData.budgetRange || null,
        duration: projectData.duration || null,
        completion_date: projectData.completionDate || null,
        client_name: projectData.clientName || null,
        client_feedback: projectData.clientFeedback || null,
        is_featured: projectData.isFeatured || false,
        sort_order: projectData.sortOrder || 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating portfolio project:', error);
      return { data: null, error };
    }

    return { data: data.id, error: null };
  } catch (error) {
    console.error('Error in createPortfolioProject:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing portfolio project
 */
export async function updatePortfolioProject(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  projectData: Partial<PortfolioProjectInput>
): Promise<{ data: boolean; error: any }> {
  try {
    const updateData: any = {};
    
    if (projectData.title !== undefined) updateData.title = projectData.title;
    if (projectData.description !== undefined) updateData.description = projectData.description || null;
    if (projectData.categoryId !== undefined) updateData.category_id = projectData.categoryId || null;
    if (projectData.location !== undefined) updateData.location = projectData.location || null;
    if (projectData.projectType !== undefined) updateData.project_type = projectData.projectType || null;
    if (projectData.budgetRange !== undefined) updateData.budget_range = projectData.budgetRange || null;
    if (projectData.duration !== undefined) updateData.duration = projectData.duration || null;
    if (projectData.completionDate !== undefined) updateData.completion_date = projectData.completionDate || null;
    if (projectData.clientName !== undefined) updateData.client_name = projectData.clientName || null;
    if (projectData.clientFeedback !== undefined) updateData.client_feedback = projectData.clientFeedback || null;
    if (projectData.isFeatured !== undefined) updateData.is_featured = projectData.isFeatured;
    if (projectData.sortOrder !== undefined) updateData.sort_order = projectData.sortOrder;

    const { error } = await supabase
      .from('portfolio_projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) {
      console.error('Error updating portfolio project:', error);
      return { data: false, error };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error in updatePortfolioProject:', error);
    return { data: false, error };
  }
}

/**
 * Delete a portfolio project
 */
export async function deletePortfolioProject(
  supabase: ReturnType<typeof createClient>,
  projectId: string
): Promise<{ data: boolean; error: any }> {
  try {
    // Portfolio project images will be deleted via CASCADE
    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting portfolio project:', error);
      return { data: false, error };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error in deletePortfolioProject:', error);
    return { data: false, error };
  }
}

/**
 * Add image to portfolio project
 */
export async function addPortfolioProjectImage(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  fileUploadId: string,
  imageData?: {
    title?: string;
    description?: string;
    altText?: string;
    imageType?: 'before' | 'during' | 'after' | 'general' | 'detail';
    sortOrder?: number;
  }
): Promise<{ data: string | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('portfolio_project_images')
      .insert({
        project_id: projectId,
        file_id: fileUploadId,
        title: imageData?.title || null,
        description: imageData?.description || null,
        alt_text: imageData?.altText || null,
        image_type: imageData?.imageType || 'general',
        sort_order: imageData?.sortOrder || 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding portfolio project image:', error);
      return { data: null, error };
    }

    return { data: data.id, error: null };
  } catch (error) {
    console.error('Error in addPortfolioProjectImage:', error);
    return { data: null, error };
  }
}

/**
 * Remove image from portfolio project
 */
export async function removePortfolioProjectImage(
  supabase: ReturnType<typeof createClient>,
  imageId: string
): Promise<{ data: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('portfolio_project_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error removing portfolio project image:', error);
      return { data: false, error };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error in removePortfolioProjectImage:', error);
    return { data: false, error };
  }
}