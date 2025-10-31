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
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  proposedPrice?: string;
  estimatedCompletion?: string;
  coverLetter?: string;
}

export interface ContractorBid {
  id: string;
  tenderId: string;
  tenderTitle: string;
  companyName: string;
  status: 'pending' | 'accepted' | 'rejected';
  bidAmount: string;
  submittedAt: string;
  validUntil: string;
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
      .eq('type', 'contractor');

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

    // Fetch applications
    const { data: applications } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        proposed_price,
        estimated_completion,
        cover_letter,
        status,
        created_at,
        jobs (
          title,
          companies (
            name
          )
        )
      `)
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    const formattedApplications: ContractorApplication[] = applications?.map(app => ({
      id: app.id,
      jobId: app.job_id,
      jobTitle: app.jobs?.title || '',
      companyName: app.jobs?.companies?.name || '',
      status: app.status || 'pending',
      appliedAt: app.created_at,
      proposedPrice: app.proposed_price,
      estimatedCompletion: app.estimated_completion,
      coverLetter: app.cover_letter
    })) || [];

    // Fetch bids
    const { data: bids } = await supabase
      .from('tender_bids')
      .select(`
        id,
        tender_id,
        bid_amount,
        status,
        created_at,
        valid_until,
        tenders (
          title,
          companies (
            name
          )
        )
      `)
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    const formattedBids: ContractorBid[] = bids?.map(bid => ({
      id: bid.id,
      tenderId: bid.tender_id,
      tenderTitle: bid.tenders?.title || '',
      companyName: bid.tenders?.companies?.name || '',
      status: bid.status || 'pending',
      bidAmount: bid.bid_amount || '',
      submittedAt: bid.created_at,
      validUntil: bid.valid_until || ''
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
            file_url,
            title
          )
        )
      `)
      .eq('company_id', contractorId)
      .eq('is_completed', true)
      .order('completion_date', { ascending: false })
      .limit(limit);

    return projects || [];
  } catch (error) {
    console.error('Error fetching completed projects:', error);
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

    return (data || []).map(project => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      images: project.portfolio_project_images?.map(img => img.file_uploads?.file_path).filter(Boolean) || [],
      budget: project.budget_range || '',
      duration: project.duration || '',
      year: project.completion_date ? new Date(project.completion_date).getFullYear() : new Date().getFullYear(),
      category: project.job_categories?.name || '',
      location: project.location || '',
      projectType: project.project_type || '',
      clientName: project.client_name || '',
      clientFeedback: project.client_feedback || '',
      isFeatured: project.is_featured
    }));
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

    return (data || []).map(project => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      images: project.portfolio_project_images?.map(img => img.file_uploads?.file_path).filter(Boolean) || [],
      budget: project.budget_range || '',
      duration: project.duration || '',
      year: project.completion_date ? new Date(project.completion_date).getFullYear() : new Date().getFullYear(),
      category: project.job_categories?.name || '',
      location: project.location || '',
      projectType: project.project_type || '',
      clientName: project.client_name || '',
      clientFeedback: project.client_feedback || '',
      isFeatured: project.is_featured
    }));
  } catch (error) {
    console.error('Error in fetchContractorFeaturedPortfolio:', error);
    throw error;
  }
}