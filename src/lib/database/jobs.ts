import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export interface JobFilters {
  categories?: string[];
  subcategories?: string[];
  locations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  postType?: 'job' | 'tender' | 'all';
  status?: string;
  sortBy?: 'newest' | 'oldest' | 'budget_low' | 'budget_high' | 'deadline';
  searchQuery?: string;
  limit?: number;
  offset?: number;
  bounds?: { north: number; south: number; east: number; west: number };
}

export interface JobLocation {
  city: string;
  sublocality_level_1?: string;
}

export interface JobWithCompany {
  id: string;
  title: string;
  description: string;
  location: JobLocation | string; // Support both formats for backward compatibility
  latitude: number | null;
  longitude: number | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: string | null;
  currency: string;
  project_duration: string | null;
  deadline: string | null;
  urgency: string;
  status: string;
  type: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  building_type: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  skills_required: string[] | null;
  images: string[] | null;
  applications_count: number;
  views_count: number;
  bookmarks_count: number;
  created_at: string;
  published_at: string | null;
  subcategory: string | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

export interface TenderWithCompany {
  id: string;
  title: string;
  description: string;
  location: JobLocation | string; // Support both formats for backward compatibility
  latitude: number | null;
  longitude: number | null;
  estimated_value: number;
  currency: string;
  status: string;
  submission_deadline: string;
  evaluation_deadline: string | null;
  project_duration: string | null;
  is_public: boolean;
  requirements: string[] | null;
  evaluation_criteria: any;
  phases: any;
  current_phase: string | null;
  wadium: number | null;
  bids_count: number;
  views_count: number;
  created_at: string;
  published_at: string | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

/**
 * Fetch jobs from the database with optional filters
 */
export async function fetchJobs(
  supabase: SupabaseClient<Database>,
  filters: JobFilters = {}
): Promise<{ data: JobWithCompany[] | null; error: any }> {
  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:companies!jobs_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!jobs_category_id_fkey (
          name,
          slug
        )
      `)
      .eq('status', (filters.status || 'active') as any)
      .eq('is_public', true);

    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category_id', filters.categories);
    }

    if (filters.subcategories && filters.subcategories.length > 0) {
      query = query.in('subcategory', filters.subcategories);
    }

    if (filters.locations && filters.locations.length > 0) {
      // Filter by city in JSONB location object
      query = query.or(
        filters.locations.map(city => `location->>'city'.eq.${city}`).join(',')
      );
    }

    if (filters.budgetMin !== undefined) {
      query = query.gte('budget_min', filters.budgetMin);
    }

    if (filters.budgetMax !== undefined) {
      query = query.lte('budget_max', filters.budgetMax);
    }

    if (filters.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply bounds filtering (geographic bounds)
    if (filters.bounds) {
      query = query
        .gte('latitude', filters.bounds.south)
        .lte('latitude', filters.bounds.north)
        .gte('longitude', filters.bounds.west)
        .lte('longitude', filters.bounds.east);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'budget_low':
        query = query.order('budget_min', { ascending: true, nullsFirst: false });
        break;
      case 'budget_high':
        query = query.order('budget_max', { ascending: false, nullsFirst: false });
        break;
      case 'deadline':
        query = query.order('deadline', { ascending: true, nullsFirst: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    return { data: data as any, error };
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch tenders from the database with optional filters
 */
export async function fetchTenders(
  supabase: SupabaseClient<Database>,
  filters: JobFilters = {},
  managerId?: string // If provided, include manager's drafts even if not public
): Promise<{ data: TenderWithCompany[] | null; error: any }> {
  try {
    // Type assertion needed as tenders table may not be in generated types yet
    let query = (supabase as any)
      .from('tenders')
      .select(`
        *,
        company:companies!tenders_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!tenders_category_id_fkey (
          name,
          slug
        )
      `);

    // Apply status filter
    // Only filter by status if explicitly set and not 'all'
    // If managerId is provided, RLS policies will allow them to see their own tenders regardless of status
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    // If no status filter and no managerId, default to active (public view)
    else if (!filters.status && !managerId) {
      query = query.eq('status', 'active');
    }

    // For public tenders, only show public ones
    // For managers viewing their own tenders, show all (including drafts)
    if (managerId) {
      // Manager can see their own tenders regardless of public status
      // Use a more complex filter: show manager's tenders OR public tenders
      // We'll filter after fetching if needed, or use a better query structure
      // For now, fetch all tenders and filter client-side for manager's own tenders
      // This is simpler and works with RLS policies
    } else {
      // Public view - only show public tenders
      query = query.eq('is_public', true);
    }

    // Apply filters (using any to avoid type issues with tenders table)
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category_id' as any, filters.categories);
    }

    if (filters.locations && filters.locations.length > 0) {
      query = query.in('location' as any, filters.locations);
    }

    if (filters.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply bounds filtering (geographic bounds)
    if (filters.bounds) {
      query = query
        .gte('latitude' as any, filters.bounds.south)
        .lte('latitude' as any, filters.bounds.north)
        .gte('longitude' as any, filters.bounds.west)
        .lte('longitude' as any, filters.bounds.east);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'deadline':
        query = query.order('submission_deadline', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    return { data: data as any, error };
  } catch (err) {
    console.error('Error fetching tenders:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch both jobs and tenders combined
 */
export async function fetchJobsAndTenders(
  supabase: SupabaseClient<Database>,
  filters: JobFilters = {}
) {
  const [jobsResult, tendersResult] = await Promise.all([
    fetchJobs(supabase, filters),
    fetchTenders(supabase, filters),
  ]);

  if (jobsResult.error || tendersResult.error) {
    return {
      data: null,
      error: jobsResult.error || tendersResult.error,
    };
  }

  // Combine and normalize the data
  const jobs = (jobsResult.data || []).map((job) => {
    // Keep location as object to preserve sublocality data
    const locationData = typeof job.location === 'string' 
      ? { city: job.location }
      : job.location || { city: 'Unknown' };
    
    return {
    id: job.id,
    title: job.title,
    description: job.description,
    company: job.company?.name || 'Unknown',
    location: locationData, // Keep as object to preserve sublocality_level_1
    type: job.type,
    postType: 'job' as const,
    salary: job.budget_max
      ? `${job.budget_min || 0} - ${job.budget_max} ${job.currency}`
      : `${job.budget_min || 0} ${job.currency}`,
    budget: job.budget_max
      ? `${job.budget_min || 0} - ${job.budget_max} ${job.currency}`
      : `${job.budget_min || 0} ${job.currency}`,
    budget_min: job.budget_min ?? null,
    budget_max: job.budget_max ?? null,
    category: job.category?.name || 'Inne',
    subcategory: job.subcategory || undefined,
    deadline: job.deadline || undefined,
    urgency: job.urgency,
    applications: job.applications_count,
    verified: job.company?.is_verified || false,
    urgent: job.urgency === 'high',
    premium: job.type === 'premium',
    postedTime: getTimeAgo(job.created_at),
    lat: ensureValidCoordinates(job.latitude, job.longitude, locationData.city || '', job.id)?.lat,
    lng: ensureValidCoordinates(job.latitude, job.longitude, locationData.city || '', job.id)?.lng,
    companyLogo: job.company?.logo_url || undefined,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    skills: job.skills_required || [],
    visits_count: job.views_count || 0,
    bookmarks_count: job.bookmarks_count || 0,
    hasInsurance: false, // Would need to check certificates
    completedJobs: 0, // Would need to query
    certificates: [], // Would need to query
    searchKeywords: job.skills_required || [],
    clientType: mapCompanyTypeToClientType(undefined), // Company type not available in current query
  };
  });

  const tenders = (tendersResult.data || []).map((tender) => {
    // Keep location as object to preserve sublocality data
    const locationData = typeof tender.location === 'string' 
      ? { city: tender.location }
      : tender.location || { city: 'Unknown' };
    
    return {
    id: tender.id,
    title: tender.title,
    description: tender.description,
    company: tender.company?.name || 'Unknown',
    location: locationData, // Keep as object to preserve sublocality_level_1
    type: 'Przetarg',
    postType: 'tender' as const,
    salary: `${tender.estimated_value} ${tender.currency}`,
    budget: `${tender.estimated_value} ${tender.currency}`,
    category: tender.category?.name || 'Inne',
    deadline: tender.submission_deadline,
    applications: tender.bids_count,
    verified: tender.company?.is_verified || false,
    urgent: false,
    premium: false,
    postedTime: getTimeAgo(tender.created_at),
    lat: ensureValidCoordinates(tender.latitude, tender.longitude, locationData.city || '', tender.id)?.lat,
    lng: ensureValidCoordinates(tender.latitude, tender.longitude, locationData.city || '', tender.id)?.lng,
    companyLogo: tender.company?.logo_url || undefined,
    visits_count: tender.views_count || 0,
    bookmarks_count: 0, // Tenders don't have bookmarks_count yet
    clientType: mapCompanyTypeToClientType(undefined), // Company type not available in current query
    tenderInfo: {
      tenderType: 'Zamówienie publiczne',
      phases: tender.phases || [],
      currentPhase: tender.current_phase || 'Składanie ofert',
      wadium: tender.wadium ? `${tender.wadium} ${tender.currency}` : '0 PLN',
      evaluationCriteria: tender.evaluation_criteria || [],
      documentsRequired: tender.requirements || [],
      submissionDeadline: tender.submission_deadline,
      projectDuration: tender.project_duration || 'Do uzgodnienia',
    },
  };
  });

  // Combine and sort
  const combined = [...jobs, ...tenders];

  // Remove duplicates based on ID to ensure no duplicates
  const uniqueCombined = combined.filter((item, index, self) => {
    if (!item || !item.id) return false; // Skip invalid items
    return index === self.findIndex(i => i && i.id === item.id);
  });

  // Sort combined results
  if (filters.sortBy === 'newest' || !filters.sortBy) {
    uniqueCombined.sort((a, b) => new Date(b.postedTime).getTime() - new Date(a.postedTime).getTime());
  }

  return { data: uniqueCombined, error: null };
}

/**
 * Fetch a single job by ID
 */
export async function fetchJobById(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<{ data: JobWithCompany | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        company:companies!jobs_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!jobs_category_id_fkey (
          name,
          slug
        )
      `)
      .eq('id', jobId)
      .single();

    return { data: data as any, error };
  } catch (err) {
    console.error('Error fetching job:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch a single tender by ID
 */
export async function fetchTenderById(
  supabase: SupabaseClient<Database>,
  tenderId: string
): Promise<{ data: TenderWithCompany | null; error: any }> {
  try {
    // Type assertion needed as tenders table may not be in generated types yet
    const result = await (supabase as any)
      .from('tenders')
      .select(`
        *,
        company:companies!tenders_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!tenders_category_id_fkey (
          name,
          slug
        )
      `)
      .eq('id', tenderId)
      .single();

    return { data: result.data as any, error: result.error };
  } catch (err) {
    console.error('Error fetching tender:', err);
    return { data: null, error: err };
  }
}

/**
 * Increment views_count for a job
 */
export async function incrementJobViews(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<{ error: any }> {
  try {
    // Fetch current views_count
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('views_count')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      return { error: fetchError };
    }

    if (!currentJob) {
      return { error: new Error('Job not found') };
    }

    // Increment and update
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ views_count: (currentJob.views_count || 0) + 1 })
      .eq('id', jobId);

    return { error: updateError };
  } catch (err) {
    console.error('Error incrementing job views:', err);
    return { error: err };
  }
}

/**
 * Increment views_count for a tender
 */
export async function incrementTenderViews(
  supabase: SupabaseClient<Database>,
  tenderId: string
): Promise<{ error: any }> {
  try {
    // Fetch current views_count
    const { data: currentTender, error: fetchError } = await (supabase as any)
      .from('tenders')
      .select('views_count')
      .eq('id', tenderId)
      .single();

    if (fetchError) {
      return { error: fetchError };
    }

    if (!currentTender) {
      return { error: new Error('Tender not found') };
    }

    // Increment and update
    const { error: updateError } = await (supabase as any)
      .from('tenders')
      .update({ views_count: (currentTender.views_count || 0) + 1 })
      .eq('id', tenderId);

    return { error: updateError };
  } catch (err) {
    console.error('Error incrementing tender views:', err);
    return { error: err };
  }
}

/**
 * Map company type to client type for filtering
 */
function mapCompanyTypeToClientType(companyType?: string): string {
  switch (companyType) {
    case 'spółdzielnia':
      return 'Spółdzielnia Mieszkaniowa';
    case 'wspólnota':
      return 'Wspólnota Mieszkaniowa';
    case 'housing_association':
      return 'Wspólnota Mieszkaniowa';
    case 'cooperative':
      return 'Spółdzielnia Mieszkaniowa';
    case 'condo_management':
      return 'Wspólnota Mieszkaniowa';
    case 'property_management':
      return 'Wspólnota Mieszkaniowa';
    default:
      return 'Wspólnota Mieszkaniowa';
  }
}

/**
 * Validate and ensure coordinates exist, with fallback to city center + random scattering
 */
function ensureValidCoordinates(lat?: number | null, lng?: number | null, location?: string, jobId?: string): { lat: number; lng: number } | null {
  // If coordinates exist and are valid
  if (lat && lng && lat !== 0 && lng !== 0 && 
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }

  // Fallback to city center coordinates with random scattering
  if (location) {
    const cityCoords = findCityCoordinates(location);
    if (cityCoords) {
      console.warn(`Using city fallback coordinates for location: ${location}`);
      return addRandomScattering(cityCoords, jobId);
    }
  }

  // Default to Warsaw center with scattering if no coordinates available
  console.warn(`No valid coordinates found for location: ${location}, using Warsaw center`);
  return addRandomScattering({ lat: 52.2297, lng: 21.0122 }, jobId);
}

/**
 * Add random scattering around coordinates to avoid overlapping markers
 */
function addRandomScattering(coords: { lat: number; lng: number }, jobId?: string): { lat: number; lng: number } {
  // Use job ID if available for more consistent scattering per job
  const seed = jobId || coords.lat.toString() + coords.lng.toString();
  
  // Create a deterministic hash from the seed
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate pseudo-random offsets using multiple hash variations
  const latHash = hash % 1000;
  const lngHash = (hash * 17) % 1000; // Different multiplier for longitude
  
  // Convert to offsets (roughly ±0.015 degrees = ±1.5km radius)
  const latOffset = ((latHash - 500) / 100000) * 15; // ±0.015 degrees
  const lngOffset = ((lngHash - 500) / 100000) * 15; // ±0.015 degrees
  
  return {
    lat: coords.lat + latOffset,
    lng: coords.lng + lngOffset
  };
}

/**
 * Find city coordinates from location string
 */
function findCityCoordinates(location: string): { lat: number; lng: number } | null {
  const normalizedLocation = location.toLowerCase().trim();
  
  const cityMap: Record<string, { lat: number; lng: number }> = {
    'warszawa': { lat: 52.2297, lng: 21.0122 },
    'kraków': { lat: 50.0647, lng: 19.9450 },
    'krakow': { lat: 50.0647, lng: 19.9450 },
    'gdańsk': { lat: 54.3520, lng: 18.6466 },
    'gdansk': { lat: 54.3520, lng: 18.6466 },
    'wrocław': { lat: 51.1079, lng: 17.0385 },
    'wroclaw': { lat: 51.1079, lng: 17.0385 },
    'poznań': { lat: 52.4064, lng: 16.9252 },
    'poznan': { lat: 52.4064, lng: 16.9252 },
    'łódź': { lat: 51.7592, lng: 19.4550 },
    'lodz': { lat: 51.7592, lng: 19.4550 },
    'katowice': { lat: 50.2649, lng: 19.0238 },
    'szczecin': { lat: 53.4285, lng: 14.5528 },
    'lublin': { lat: 51.2465, lng: 22.5684 },
    'białystok': { lat: 53.1325, lng: 23.1688 },
    'bialystok': { lat: 53.1325, lng: 23.1688 },
    'bydgoszcz': { lat: 53.1235, lng: 18.0084 },
    'ursynów': { lat: 52.1394, lng: 21.0458 },
    'ursynow': { lat: 52.1394, lng: 21.0458 },
    'mokotów': { lat: 52.1735, lng: 21.0422 },
    'mokotow': { lat: 52.1735, lng: 21.0422 },
  };

  for (const [cityName, coords] of Object.entries(cityMap)) {
    if (normalizedLocation.includes(cityName)) {
      return coords;
    }
  }
  
  return null;
}

/**
 * Helper function to convert date to "time ago" format
 */
function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Przed chwilą';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dni temu`;
  
  return past.toLocaleDateString('pl-PL');
}

/**
 * Create a new tender in the database
 */
export async function createTender(
  supabase: SupabaseClient<Database>,
  tenderData: {
    title: string;
    description: string;
    category: string; // Category name, will be converted to category_id
    location: string;
    estimatedValue: string;
    currency: string;
    submissionDeadline: Date;
    evaluationDeadline: Date;
    requirements: string[];
    evaluationCriteria: any[];
    documents?: any[];
    isPublic: boolean;
    allowQuestions: boolean;
    questionsDeadline?: Date;
    minimumExperience: number;
    requiredCertificates: string[];
    insuranceRequired: string;
    advancePayment: boolean;
    performanceBond: boolean;
    status?: 'draft' | 'active';
    managerId: string; // User profile ID
    companyId: string; // Company ID
    address?: string;
    latitude?: number;
    longitude?: number;
    projectDuration?: string;
  }
): Promise<{ data: TenderWithCompany | null; error: any }> {
  try {
    // Map form category names to database category names
    const categoryMapping: Record<string, string> = {
      'Utrzymanie Czystości i Zieleni': 'Usługi Sprzątające',
      'Roboty Remontowo-Budowlane': 'Remonty i Budownictwo',
      'Instalacje i systemy': 'Instalacje Techniczne',
      'Utrzymanie techniczne i konserwacja': 'Zarządzanie Nieruchomościami',
      'Specjalistyczne usługi': 'Zarządzanie Nieruchomościami',
    };

    // Use mapped category name if available, otherwise use original
    const searchCategoryName = categoryMapping[tenderData.category] || tenderData.category;

    // First, try exact match (case-insensitive)
    let { data: categoryData, error: categoryError } = await (supabase as any)
      .from('job_categories')
      .select('id, name')
      .ilike('name', searchCategoryName)
      .eq('is_active', true)
      .maybeSingle();

    // If exact match fails, try partial match
    if (categoryError || !categoryData) {
      const { data: partialMatch, error: partialError } = await (supabase as any)
        .from('job_categories')
        .select('id, name')
        .ilike('name', `%${searchCategoryName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!partialError && partialMatch) {
        categoryData = partialMatch;
        categoryError = null;
      }
    }

    // If still no match, try searching with the original category name
    if (categoryError || !categoryData) {
      const { data: originalMatch, error: originalError } = await (supabase as any)
        .from('job_categories')
        .select('id, name')
        .ilike('name', `%${tenderData.category}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!originalError && originalMatch) {
        categoryData = originalMatch;
        categoryError = null;
      }
    }

    if (categoryError || !categoryData) {
      console.error('Error finding category:', {
        error: categoryError,
        searchedCategory: tenderData.category,
        mappedCategory: searchCategoryName,
      });
      
      // Try to get all available categories for debugging
      const { data: allCategories } = await (supabase as any)
        .from('job_categories')
        .select('name, slug')
        .eq('is_active', true)
        .limit(20);
      
      console.error('Available categories:', allCategories);
      
      return { 
        data: null, 
        error: new Error(`Category "${tenderData.category}" not found. Available categories: ${allCategories?.map((c: any) => c.name).join(', ') || 'none'}`) 
      };
    }

    const categoryId = categoryData.id;

    // Prepare documents JSONB
    const documentsJson = tenderData.documents ? tenderData.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      // Note: File objects can't be stored directly, they need to be uploaded first
      // For now, we'll store metadata only
    })) : null;

    // Insert tender
    const { data: insertedTender, error: insertError } = await (supabase as any)
      .from('tenders')
      .insert({
        title: tenderData.title,
        description: tenderData.description,
        category_id: categoryId,
        manager_id: tenderData.managerId,
        company_id: tenderData.companyId,
        location: tenderData.location,
        address: tenderData.address || null,
        latitude: tenderData.latitude || null,
        longitude: tenderData.longitude || null,
        estimated_value: parseFloat(tenderData.estimatedValue),
        currency: tenderData.currency,
        status: tenderData.status || 'draft',
        submission_deadline: tenderData.submissionDeadline.toISOString(),
        evaluation_deadline: tenderData.evaluationDeadline.toISOString(),
        project_duration: tenderData.projectDuration || null,
        is_public: tenderData.isPublic,
        requirements: tenderData.requirements,
        evaluation_criteria: tenderData.evaluationCriteria,
        documents: documentsJson,
        published_at: tenderData.status === 'active' ? new Date().toISOString() : null,
      })
      .select(`
        *,
        company:companies!tenders_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!tenders_category_id_fkey (
          name,
          slug
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating tender:', insertError);
      return { data: null, error: insertError };
    }

    return { data: insertedTender as any, error: null };
  } catch (err) {
    console.error('Error creating tender:', err);
    return { data: null, error: err };
  }
}

/**
 * Update an existing draft tender in the database
 * Only draft tenders can be updated
 */
export async function updateTender(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  tenderData: {
    title: string;
    description: string;
    category: string; // Category name, will be converted to category_id
    location: string;
    estimatedValue: string;
    currency: string;
    submissionDeadline: Date;
    evaluationDeadline: Date;
    requirements: string[];
    evaluationCriteria: any[];
    documents?: any[];
    isPublic: boolean;
    allowQuestions: boolean;
    questionsDeadline?: Date;
    minimumExperience: number;
    requiredCertificates: string[];
    insuranceRequired: string;
    advancePayment: boolean;
    performanceBond: boolean;
    status?: 'draft' | 'active';
    address?: string;
    latitude?: number;
    longitude?: number;
    projectDuration?: string;
  }
): Promise<{ data: TenderWithCompany | null; error: any }> {
  try {
    // First, verify the tender exists and is in draft status
    const { data: existingTender, error: fetchError } = await (supabase as any)
      .from('tenders')
      .select('id, status')
      .eq('id', tenderId)
      .single();

    if (fetchError || !existingTender) {
      return { 
        data: null, 
        error: new Error('Przetarg nie został znaleziony') 
      };
    }

    if (existingTender.status !== 'draft') {
      return { 
        data: null, 
        error: new Error('Tylko przetargi w statusie szkicu mogą być edytowane') 
      };
    }

    // Map form category names to database category names
    const categoryMapping: Record<string, string> = {
      'Utrzymanie Czystości i Zieleni': 'Usługi Sprzątające',
      'Roboty Remontowo-Budowlane': 'Remonty i Budownictwo',
      'Instalacje i systemy': 'Instalacje Techniczne',
      'Utrzymanie techniczne i konserwacja': 'Zarządzanie Nieruchomościami',
      'Specjalistyczne usługi': 'Zarządzanie Nieruchomościami',
    };

    // Use mapped category name if available, otherwise use original
    const searchCategoryName = categoryMapping[tenderData.category] || tenderData.category;

    // First, try exact match (case-insensitive)
    let { data: categoryData, error: categoryError } = await (supabase as any)
      .from('job_categories')
      .select('id, name')
      .ilike('name', searchCategoryName)
      .eq('is_active', true)
      .maybeSingle();

    // If exact match fails, try partial match
    if (categoryError || !categoryData) {
      const { data: partialMatch, error: partialError } = await (supabase as any)
        .from('job_categories')
        .select('id, name')
        .ilike('name', `%${searchCategoryName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!partialError && partialMatch) {
        categoryData = partialMatch;
        categoryError = null;
      }
    }

    // If still no match, try searching with the original category name
    if (categoryError || !categoryData) {
      const { data: originalMatch, error: originalError } = await (supabase as any)
        .from('job_categories')
        .select('id, name')
        .ilike('name', `%${tenderData.category}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!originalError && originalMatch) {
        categoryData = originalMatch;
        categoryError = null;
      }
    }

    if (categoryError || !categoryData) {
      console.error('Error finding category:', {
        error: categoryError,
        searchedCategory: tenderData.category,
        mappedCategory: searchCategoryName,
      });
      
      // Try to get all available categories for debugging
      const { data: allCategories } = await (supabase as any)
        .from('job_categories')
        .select('name, slug')
        .eq('is_active', true)
        .limit(20);
      
      console.error('Available categories:', allCategories);
      
      return { 
        data: null, 
        error: new Error(`Category "${tenderData.category}" not found. Available categories: ${allCategories?.map((c: any) => c.name).join(', ') || 'none'}`) 
      };
    }

    const categoryId = categoryData.id;

    // Prepare documents JSONB
    const documentsJson = tenderData.documents ? tenderData.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      // Note: File objects can't be stored directly, they need to be uploaded first
      // For now, we'll store metadata only
    })) : null;

    // Update tender
    const { data: updatedTender, error: updateError } = await (supabase as any)
      .from('tenders')
      .update({
        title: tenderData.title,
        description: tenderData.description,
        category_id: categoryId,
        location: tenderData.location,
        address: tenderData.address || null,
        latitude: tenderData.latitude || null,
        longitude: tenderData.longitude || null,
        estimated_value: parseFloat(tenderData.estimatedValue),
        currency: tenderData.currency,
        status: tenderData.status || 'draft',
        submission_deadline: tenderData.submissionDeadline.toISOString(),
        evaluation_deadline: tenderData.evaluationDeadline.toISOString(),
        project_duration: tenderData.projectDuration || null,
        is_public: tenderData.isPublic,
        requirements: tenderData.requirements,
        evaluation_criteria: tenderData.evaluationCriteria,
        documents: documentsJson,
        published_at: tenderData.status === 'active' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenderId)
      .select(`
        *,
        company:companies!tenders_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!tenders_category_id_fkey (
          name,
          slug
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating tender:', updateError);
      return { data: null, error: updateError };
    }

    return { data: updatedTender as any, error: null };
  } catch (err) {
    console.error('Error updating tender:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a new job in the database
 */
export async function createJob(
  supabase: SupabaseClient<Database>,
  jobData: {
    title: string;
    description: string;
    category: string; // Category name, will be converted to category_id
    subcategory?: string;
    location: JobLocation | string; // Can be object or string for backward compatibility
    address?: string;
    latitude?: number;
    longitude?: number;
    sublocalityLevel1?: string;
    budgetMin?: number;
    budgetMax?: number;
    budgetType?: 'fixed' | 'hourly' | 'negotiable' | 'range';
    currency?: string;
    projectDuration?: string;
    deadline?: Date | string;
    urgency?: 'low' | 'medium' | 'high';
    status?: 'draft' | 'active';
    type?: 'regular' | 'urgent' | 'premium';
    isPublic?: boolean;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    buildingType?: string;
    buildingYear?: number;
    surfaceArea?: string;
    additionalInfo?: string;
    requirements?: string[];
    responsibilities?: string[];
    skillsRequired?: string[];
    images?: string[];
    managerId: string; // User profile ID
    companyId: string; // Company ID
  }
): Promise<{ data: JobWithCompany | null; error: any }> {
  try {
    // Map form category names to database category names
    const categoryMapping: Record<string, string> = {
      'Utrzymanie Czystości i Zieleni': 'Usługi Sprzątające',
      'Roboty Remontowo-Budowlane': 'Remonty i Budownictwo',
      'Instalacje i systemy': 'Instalacje Techniczne',
      'Utrzymanie techniczne i konserwacja': 'Zarządzanie Nieruchomościami',
      'Specjalistyczne usługi': 'Zarządzanie Nieruchomościami',
    };

    // Use mapped category name if available, otherwise use original
    const searchCategoryName = categoryMapping[jobData.category] || jobData.category;

    // First, try exact match (case-insensitive)
    let { data: categoryData, error: categoryError } = await supabase
      .from('job_categories')
      .select('id, name')
      .ilike('name', searchCategoryName)
      .eq('is_active', true)
      .maybeSingle();

    // If exact match fails, try partial match
    if (categoryError || !categoryData) {
      const { data: partialMatch, error: partialError } = await supabase
        .from('job_categories')
        .select('id, name')
        .ilike('name', `%${searchCategoryName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!partialError && partialMatch) {
        categoryData = partialMatch;
        categoryError = null;
      }
    }

    // If still no match, try searching with the original category name
    if (categoryError || !categoryData) {
      const { data: originalMatch, error: originalError } = await supabase
        .from('job_categories')
        .select('id, name')
        .ilike('name', `%${jobData.category}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!originalError && originalMatch) {
        categoryData = originalMatch;
        categoryError = null;
      }
    }

    if (categoryError || !categoryData) {
      console.error('Error finding category:', {
        error: categoryError,
        searchedCategory: jobData.category,
        mappedCategory: searchCategoryName,
      });
      
      // Try to get all available categories for debugging
      const { data: allCategories } = await supabase
        .from('job_categories')
        .select('name, slug')
        .eq('is_active', true)
        .limit(20);
      
      console.error('Available categories:', allCategories);
      
      return { 
        data: null, 
        error: new Error(`Category "${jobData.category}" not found. Available categories: ${allCategories?.map((c: any) => c.name).join(', ') || 'none'}`) 
      };
    }

    const categoryId = categoryData.id;

    // Parse deadline if provided
    let deadlineDate: string | null = null;
    if (jobData.deadline) {
      if (typeof jobData.deadline === 'string') {
        deadlineDate = jobData.deadline;
      } else {
        deadlineDate = jobData.deadline.toISOString().split('T')[0];
      }
    }

    // Parse budget values
    const budgetMin = jobData.budgetMin !== undefined ? jobData.budgetMin : null;
    const budgetMax = jobData.budgetMax !== undefined ? jobData.budgetMax : null;

    // Prepare location as JSONB object
    let locationJsonb: any;
    if (typeof jobData.location === 'string') {
      // If location is a string, convert to object format
      locationJsonb = {
        city: jobData.location,
        ...(jobData.sublocalityLevel1 ? { sublocality_level_1: jobData.sublocalityLevel1 } : {})
      };
    } else {
      // If location is already an object, use it directly
      locationJsonb = {
        city: jobData.location.city,
        ...(jobData.location.sublocality_level_1 || jobData.sublocalityLevel1 
          ? { sublocality_level_1: jobData.location.sublocality_level_1 || jobData.sublocalityLevel1 } 
          : {})
      };
    }

    // Prepare insert data
    const insertData = {
      title: jobData.title,
      description: jobData.description,
      category_id: categoryId,
      subcategory: jobData.subcategory || null,
      manager_id: jobData.managerId,
      company_id: jobData.companyId,
      location: locationJsonb,
      address: jobData.address || null,
      latitude: jobData.latitude || null,
      longitude: jobData.longitude || null,
      sublocality_level_1: jobData.sublocalityLevel1 || null,
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget_type: jobData.budgetType || 'fixed',
      currency: jobData.currency || 'PLN',
      project_duration: jobData.projectDuration || null,
      deadline: deadlineDate,
      urgency: jobData.urgency || 'medium',
      status: jobData.status || 'active',
      type: jobData.type || 'regular',
      is_public: jobData.isPublic !== undefined ? jobData.isPublic : true,
      contact_person: jobData.contactPerson || null,
      contact_phone: jobData.contactPhone || null,
      contact_email: jobData.contactEmail || null,
      building_type: jobData.buildingType || null,
      building_year: jobData.buildingYear || null,
      surface_area: jobData.surfaceArea || null,
      additional_info: jobData.additionalInfo || null,
      requirements: jobData.requirements || null,
      responsibilities: jobData.responsibilities || null,
      skills_required: jobData.skillsRequired || null,
      images: jobData.images || null,
      published_at: jobData.status === 'active' ? new Date().toISOString() : null,
    };

    console.log('Inserting job with data:', {
      ...insertData,
      manager_id: jobData.managerId,
      company_id: jobData.companyId,
      category_id: categoryId,
    });

    // Insert job
    const { data: insertedJob, error: insertError } = await supabase
      .from('jobs')
      .insert(insertData)
      .select(`
        *,
        company:companies!jobs_company_id_fkey (
          id,
          name,
          logo_url,
          is_verified
        ),
        category:job_categories!jobs_category_id_fkey (
          name,
          slug
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating job:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      return { data: null, error: insertError };
    }

    return { data: insertedJob as any, error: null };
  } catch (err) {
    console.error('Error creating job:', err);
    return { data: null, error: err };
  }
}



