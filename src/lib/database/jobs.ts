import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { Application } from '../../types/application';
import type { Budget, BudgetInput } from '../../types/budget';
import { budgetFromDatabase, budgetToDatabase, formatBudget } from '../../types/budget';
import { fetchAllCategoriesWithSubcategories } from './categories';

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
  dateAdded?: string[]; // ['today', 'last-week', 'last-month', 'last-3-months', 'last-6-months', 'last-year']
}

export interface JobLocation {
  city: string;
  sublocality_level_1?: string;
}

/**
 * Normalize urgency value to ensure it's one of the valid values
 */
function normalizeUrgency(urgency: string | null | undefined): 'low' | 'medium' | 'high' {
  if (!urgency) {
    return 'medium';
  }
  const normalized = urgency.toLowerCase().trim();
  const result = ['low', 'medium', 'high'].includes(normalized)
    ? normalized as 'low' | 'medium' | 'high'
    : 'medium';
  return result;
}

export interface JobWithCompany {
  id: string;
  title: string;
  description: string;
  location: JobLocation | string; // Support both formats for backward compatibility
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: string | null;
  currency: string;
  // Consolidated budget object (computed from above fields)
  budget?: Budget;
  project_duration: string | null;
  deadline: string | null;
  urgency: string;
  status: string;
  type: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  building_type: string | null;
  building_year: number | null;
  surface_area: string | null;
  additional_info: string | null;
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

/**
 * Resolve main category_id and optional subcategory_id from Polish form labels.
 * Shared by createJob and updateManagerJob.
 */
export async function resolveJobFormCategoryIds(
  supabase: SupabaseClient<Database>,
  categoryName: string,
  subcategoryName?: string | null,
): Promise<
  | { categoryId: string; subcategoryId: string | null; error: null }
  | { categoryId: null; subcategoryId: null; error: PostgrestError }
> {
  const categoryMapping: Record<string, string> = {
    'Utrzymanie Czystości i Zieleni': 'Usługi Sprzątające',
    'Roboty Remontowo-Budowlane': 'Remonty i Budownictwo',
    'Instalacje i systemy': 'Instalacje Techniczne',
    'Utrzymanie techniczne i konserwacja': 'Zarządzanie Nieruchomościami',
    'Specjalistyczne usługi': 'Zarządzanie Nieruchomościami',
    'Inne': 'Zarządzanie Nieruchomościami',
  };

  const searchCategoryName = categoryMapping[categoryName] || categoryName;

  let { data: categoryData, error: categoryError } = await supabase
    .from('job_categories')
    .select('id, name')
    .ilike('name', searchCategoryName)
    .eq('is_active', true)
    .maybeSingle();

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

  if (categoryError || !categoryData) {
    const { data: originalMatch, error: originalError } = await supabase
      .from('job_categories')
      .select('id, name')
      .ilike('name', `%${categoryName}%`)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!originalError && originalMatch) {
      categoryData = originalMatch;
      categoryError = null;
    }
  }

  if (categoryError || !categoryData) {
    const { data: allCategories } = await supabase
      .from('job_categories')
      .select('name, slug')
      .eq('is_active', true)
      .limit(20);

    return {
      categoryId: null,
      subcategoryId: null,
      error: new Error(
        `Category "${categoryName}" not found. Available categories: ${allCategories?.map((c: { name: string }) => c.name).join(', ') || 'none'}`,
      ) as PostgrestError,
    };
  }

  const categoryId = categoryData.id;
  let subcategoryId: string | null = null;

  if (subcategoryName && subcategoryName.trim()) {
    const subTrim = subcategoryName.trim();

    let { data: subcategoryData, error: subcategoryError } = await supabase
      .from('job_categories')
      .select('id, name')
      .eq('parent_id', categoryId)
      .ilike('name', subTrim)
      .eq('is_active', true)
      .maybeSingle();

    if (subcategoryError || !subcategoryData) {
      const { data: partialSubcategory, error: partialSubcategoryError } = await supabase
        .from('job_categories')
        .select('id, name')
        .eq('parent_id', categoryId)
        .ilike('name', `%${subTrim}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!partialSubcategoryError && partialSubcategory) {
        subcategoryData = partialSubcategory;
        subcategoryError = null;
      }
    }

    if (!subcategoryError && subcategoryData) {
      subcategoryId = subcategoryData.id;
    }
  }

  return { categoryId, subcategoryId, error: null };
}

/**
 * Location for jobs table: prefer selected building (company-scoped), else company HQ city.
 */
export async function resolveJobLocationFromBuildingOrCompany(
  supabase: SupabaseClient<Database>,
  companyId: string,
  buildingId: string | null | undefined,
  companyCity: string | null | undefined,
  companyAddress: string | null | undefined,
): Promise<{ city: string; address: string | null; latitude: number | null; longitude: number | null }> {
  if (buildingId) {
    const { data: b, error } = await supabase
      .from('buildings')
      .select('city, street_address, latitude, longitude')
      .eq('id', buildingId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!error && b) {
      return {
        city: b.city || '—',
        address: b.street_address || null,
        latitude: b.latitude != null ? Number(b.latitude) : null,
        longitude: b.longitude != null ? Number(b.longitude) : null,
      };
    }
  }

  const city = (companyCity && companyCity.trim()) || 'Warszawa';
  return {
    city,
    address: companyAddress?.trim() || null,
    latitude: null,
    longitude: null,
  };
}

/**
 * Update an existing job owned by the manager. Allowed only for draft/active jobs with zero applications.
 */
export async function updateManagerJob(
  supabase: SupabaseClient<Database>,
  params: {
    jobId: string;
    managerId: string;
    companyId: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    buildingId?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    budgetType?: 'fixed' | 'hourly' | 'negotiable' | 'range';
    currency?: string;
    deadline?: Date | string | null;
    urgency?: 'low' | 'medium' | 'high';
    type?: 'regular' | 'urgent' | 'premium';
    isPublic?: boolean;
    requirements?: string[];
    additionalInfo?: string | null;
    images?: string[] | null;
  },
): Promise<{ data: JobWithCompany | null; error: PostgrestError | null }> {
  try {
    const jobId = params.jobId?.trim();
    if (!jobId) {
      return { data: null, error: new Error('Missing job id') as PostgrestError };
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('jobs')
      .select('id, manager_id, company_id, status, published_at')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { data: null, error: fetchErr || (new Error('Job not found') as PostgrestError) };
    }

    if (existing.manager_id !== params.managerId) {
      return { data: null, error: new Error('Brak uprawnień do edycji tego zgłoszenia') as PostgrestError };
    }

    if (existing.company_id !== params.companyId) {
      return { data: null, error: new Error('Zgłoszenie nie należy do tej firmy') as PostgrestError };
    }

    const status = existing.status as string;
    if (status !== 'draft' && status !== 'active') {
      return {
        data: null,
        error: new Error('Edycja jest możliwa tylko dla zgłoszeń ze statusem szkic lub aktywne') as PostgrestError,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error: countErr } = await (supabase as any)
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    if (countErr) {
      return { data: null, error: countErr as PostgrestError };
    }

    if (count !== null && count > 0) {
      return {
        data: null,
        error: new Error('Nie można edytować zgłoszenia po otrzymaniu ofert') as PostgrestError,
      };
    }

    const resolved = await resolveJobFormCategoryIds(supabase, params.category, params.subcategory);
    if (resolved.error || !resolved.categoryId) {
      return { data: null, error: resolved.error };
    }

    const { fetchUserPrimaryCompany } = await import('./companies');
    const { data: companyRow } = await fetchUserPrimaryCompany(supabase, params.managerId);
    const loc = await resolveJobLocationFromBuildingOrCompany(
      supabase,
      params.companyId,
      params.buildingId ?? null,
      companyRow?.city ?? null,
      companyRow?.address ?? null,
    );

    let deadlineDate: string | null = null;
    if (params.deadline) {
      if (typeof params.deadline === 'string') {
        deadlineDate = params.deadline;
      } else {
        deadlineDate = params.deadline.toISOString().split('T')[0];
      }
    }

    const budgetInput: BudgetInput = {
      min: params.budgetMin,
      max: params.budgetMax,
      type: params.budgetType || 'fixed',
      currency: params.currency || 'PLN',
    };
    const budgetDb = budgetToDatabase(budgetInput);

    const locationJsonb = {
      city: loc.city,
    };

    const updatePayload: Record<string, unknown> = {
      title: params.title,
      description: params.description,
      category_id: resolved.categoryId,
      subcategory_id: resolved.subcategoryId,
      building_id: params.buildingId ?? null,
      location: locationJsonb,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      budget_min: budgetDb.budget_min,
      budget_max: budgetDb.budget_max,
      budget_type: budgetDb.budget_type,
      currency: budgetDb.currency,
      deadline: deadlineDate,
      urgency: params.urgency ?? 'medium',
      type: params.type ?? 'regular',
      is_public: params.isPublic !== undefined ? params.isPublic : true,
      requirements: params.requirements ?? null,
      additional_info: params.additionalInfo ?? null,
      images: params.images ?? null,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedJob, error: updateError } = await (supabase as any)
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .eq('manager_id', params.managerId)
      .select(
        `
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
        ),
        subcategory:job_categories!jobs_subcategory_id_fkey (
          name,
          slug
        )
      `,
      )
      .single();

    if (updateError) {
      console.error('Error updating job:', updateError);
      return { data: null, error: updateError };
    }

    return { data: updatedJob as JobWithCompany, error: null };
  } catch (err) {
    console.error('Error in updateManagerJob:', err);
    return { data: null, error: err as PostgrestError };
  }
}

// Helper types for tables not yet in Database type
interface JobApplicationRow {
  id: string;
  job_id: string;
  contractor_id: string;
  company_id: string | null;
  status: string;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TenderRow {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  estimated_value: number;
  currency: string;
  status: string;
  submission_deadline: string;
  evaluation_deadline: string | null;
  views_count: number;
  bids_count: number;
  [key: string]: unknown;
}

interface TenderBidRow {
  id: string;
  tender_id: string;
  contractor_id: string;
  company_id: string | null;
  status: string;
  [key: string]: unknown;
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
  evaluation_criteria: Record<string, unknown> | null;
  phases: Record<string, unknown> | null;
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
): Promise<{ data: JobWithCompany[] | null; error: PostgrestError | null }> {
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
        ),
        subcategory:job_categories!jobs_subcategory_id_fkey (
          name,
          slug
        )
      `)
      .eq('status', (filters.status || 'active') as 'active' | 'paused' | 'cancelled' | 'draft' | 'completed')
      .eq('is_public', true);

    // Apply category and subcategory filters
    // Jobs have category_id = main category, subcategory_id = subcategory (FK to job_categories)
    if (filters.categories && filters.categories.length > 0 || filters.subcategories && filters.subcategories.length > 0) {
      const { data: allCategories } = await fetchAllCategoriesWithSubcategories(supabase);
      const mainCategoryIds: string[] = [];
      const subcategoryIds: string[] = [];

      if (allCategories) {
        if (filters.categories && filters.categories.length > 0) {
          for (const categoryName of filters.categories) {
            const category = allCategories.find(c => c.name === categoryName);
            if (category) {
              mainCategoryIds.push(category.id);
            }
          }
        }

        if (filters.subcategories && filters.subcategories.length > 0) {
          for (const mainCategory of allCategories) {
            for (const sub of mainCategory.subcategories) {
              if (filters.subcategories.includes(sub.name)) {
                subcategoryIds.push(sub.id);
              }
            }
          }
        }
      }

      // Filter by main category (category_id)
      if (mainCategoryIds.length > 0) {
        query = query.in('category_id', mainCategoryIds);
      }
      // Filter by subcategory (subcategory_id)
      if (subcategoryIds.length > 0) {
        query = query.in('subcategory_id', subcategoryIds);
      }
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

    // Apply date added filtering (created_at)
    if (filters.dateAdded && filters.dateAdded.length > 0) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      todayStart.setHours(0, 0, 0, 0);
      
      // Calculate the earliest date from all selected filters
      let earliestDate: Date | null = null;
      
      for (const dateFilter of filters.dateAdded) {
        let filterStartDate: Date;
        
        switch (dateFilter) {
          case 'today':
            filterStartDate = new Date(todayStart);
            break;
          case 'last-week':
            // Last 7 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last-month':
            // Last 30 days (more reliable than setMonth)
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last-3-months':
            // Last 90 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'last-6-months':
            // Last 180 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
          case 'last-year':
            // Last 365 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            continue;
        }
        
        // Use the earliest date (most inclusive filter)
        if (!earliestDate || filterStartDate < earliestDate) {
          earliestDate = filterStartDate;
        }
      }
      
      // Apply the date filter - jobs created_at >= earliestDate
      if (earliestDate) {
        query = query.gte('created_at', earliestDate.toISOString());
      }
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

    if (error) {
      return { data: null, error };
    }

    // Calculate applications_count dynamically if not already accurate
    if (data && data.length > 0) {
      const jobIds = data.map((job: JobWithCompany) => job.id);
      
      // Fetch counts for all jobs at once
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: countsData, error: countsError } = await (supabase as any)
        .from('job_applications')
        .select('job_id')
        .in('job_id', jobIds) as { data: JobApplicationRow[] | null; error: PostgrestError | null };

      if (!countsError && countsData) {
        // Count applications per job
        const countsMap: { [key: string]: number } = {};
        countsData?.forEach((app: JobApplicationRow) => {
          countsMap[app.job_id] = (countsMap[app.job_id] || 0) + 1;
        });

        // Update applications_count for each job
        data.forEach((job: JobWithCompany) => {
          job.applications_count = countsMap[job.id] || 0;
        });
      }
    }

    return { data: data as JobWithCompany[], error };
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
): Promise<{ data: TenderWithCompany[] | null; error: PostgrestError | null }> {
  try {
    // Type assertion needed as tenders table may not be in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Filter by manager_id to get manager's tenders (RLS will handle permissions)
      query = query.eq('manager_id', managerId);
    } else {
      // Public view - only show public tenders
      query = query.eq('is_public', true);
    }

    // Apply filters (using any to avoid type issues with tenders table)
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category_id', filters.categories);
    }

    if (filters.locations && filters.locations.length > 0) {
      query = query.in('location', filters.locations);
    }

    if (filters.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply date added filtering (created_at)
    if (filters.dateAdded && filters.dateAdded.length > 0) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      todayStart.setHours(0, 0, 0, 0);
      
      // Calculate the earliest date from all selected filters
      let earliestDate: Date | null = null;
      
      for (const dateFilter of filters.dateAdded) {
        let filterStartDate: Date;
        
        switch (dateFilter) {
          case 'today':
            filterStartDate = new Date(todayStart);
            break;
          case 'last-week':
            // Last 7 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last-month':
            // Last 30 days (more reliable than setMonth)
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last-3-months':
            // Last 90 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'last-6-months':
            // Last 180 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
          case 'last-year':
            // Last 365 days
            filterStartDate = new Date(todayStart);
            filterStartDate.setTime(filterStartDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            continue;
        }
        
        // Use the earliest date (most inclusive filter)
        if (!earliestDate || filterStartDate < earliestDate) {
          earliestDate = filterStartDate;
        }
      }
      
      // Apply the date filter - tenders created_at >= earliestDate
      if (earliestDate) {
        query = query.gte('created_at', earliestDate.toISOString());
      }
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

    if (error) {
      console.error('Supabase error fetching tenders:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        error: error
      });
      return { data: null, error };
    }

    // Calculate bids_count dynamically if not already accurate
    if (data && data.length > 0) {
      const tenderIds = (data || []).map((tender: TenderWithCompany) => tender.id);
      
      // Fetch counts for all tenders at once
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: countsData, error: countsError } = await (supabase as any)
        .from('tender_bids')
        .select('tender_id')
        .in('tender_id', tenderIds) as { data: TenderBidRow[] | null; error: PostgrestError | null };

      if (!countsError && countsData) {
        // Count bids per tender
        const countsMap: { [key: string]: number } = {};
        countsData?.forEach((bid: TenderBidRow) => {
          countsMap[bid.tender_id] = (countsMap[bid.tender_id] || 0) + 1;
        });

        // Update bids_count for each tender
        data.forEach((tender: TenderWithCompany) => {
          (tender as TenderWithCompany & { bids_count: number }).bids_count = countsMap[tender.id] || 0;
        });
      }
    }

    return { data: data as unknown as TenderWithCompany[], error };
  } catch (err) {
    console.error('Exception fetching tenders:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { data: null, error: new Error(errorMessage) as PostgrestError };
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
    
    // Create consolidated budget object
    const budget: Budget = budgetFromDatabase({
      budget_min: job.budget_min ?? null,
      budget_max: job.budget_max ?? null,
      budget_type: (job.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
      currency: job.currency || 'PLN',
    });
    
    return {
    id: job.id,
    title: job.title,
    description: job.description,
    company: job.company?.name || 'Unknown',
    companyInfo: job.company ? {
      id: job.company.id,
      logo_url: job.company.logo_url,
      is_verified: job.company.is_verified,
    } : undefined,
    location: locationData, // Keep as object to preserve sublocality_level_1
    type: job.type,
    postType: 'job' as const,
    salary: formatBudget(budget), // Display string for salary
    budget, // Budget object with all fields (min, max, type, currency)
    category: job.category?.name || 'Inne',
    subcategory: (job.subcategory as unknown as { name: string } | null | undefined)?.name || undefined,
    deadline: job.deadline || undefined,
    urgency: normalizeUrgency(job.urgency),
    metrics: {
      applications: job.applications_count,
      visits: job.views_count || 0,
      bookmarks: job.bookmarks_count || 0,
    },
    // Legacy metrics fields (for backward compatibility)
    applications: job.applications_count,
    visits_count: job.views_count || 0,
    bookmarks_count: job.bookmarks_count || 0,
    verified: job.company?.is_verified || false,
    urgent: job.urgency === 'high',
    premium: job.type === 'premium',
    trust: {
      verified: job.company?.is_verified || false,
      isPremium: job.type === 'premium',
      hasInsurance: false, // Would need to check certificates
      completedJobs: 0, // Would need to query
      certificates: [], // Would need to query
    },
    // Legacy trust fields (for backward compatibility)
    isPremium: job.type === 'premium',
    hasInsurance: false, // Would need to check certificates
    completedJobs: 0, // Would need to query
    certificates: [], // Would need to query
    postedTime: getTimeAgo(job.created_at),
    created_at: job.created_at, // Preserve original timestamp for filtering
    lat: ensureValidCoordinates(job.latitude, job.longitude, locationData.city || '', job.id)?.lat,
    lng: ensureValidCoordinates(job.latitude, job.longitude, locationData.city || '', job.id)?.lng,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    skills: job.skills_required || [],
    searchKeywords: job.skills_required || [],
    clientType: mapCompanyTypeToClientType(undefined), // Company type not available in current query
    contact: job.contact_person || job.contact_phone || job.contact_email ? {
      person: job.contact_person || '',
      phone: job.contact_phone || '',
      email: job.contact_email || '',
    } : undefined,
    // Legacy contact fields (for backward compatibility)
    contactPerson: job.contact_person || undefined,
    contactPhone: job.contact_phone || undefined,
    contactEmail: job.contact_email || undefined,
    building: job.building_type || job.building_year || job.surface_area ? {
      type: job.building_type || '',
      year: job.building_year || 0,
      surface: job.surface_area || '',
      address: job.address || undefined,
      additionalInfo: job.additional_info || undefined,
    } : undefined,
    // Legacy building fields (for backward compatibility)
    buildingType: job.building_type || undefined,
    buildingYear: job.building_year || undefined,
    surface: job.surface_area || undefined,
    additionalInfo: job.additional_info || undefined,
    address: job.address || undefined
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
    companyInfo: tender.company ? {
      id: tender.company.id,
      logo_url: tender.company.logo_url,
      is_verified: tender.company.is_verified,
    } : undefined,
    location: locationData, // Keep as object to preserve sublocality_level_1
    type: 'Przetarg',
    postType: 'tender' as const,
    salary: `${tender.estimated_value} ${tender.currency}`,
    budget: `${tender.estimated_value} ${tender.currency}`,
    category: tender.category?.name || 'Inne',
    deadline: tender.submission_deadline,
    urgency: 'medium' as const, // Tenders don't have urgency field, default to medium
    applications: tender.bids_count,
    verified: tender.company?.is_verified || false,
    urgent: false,
    premium: false,
    postedTime: getTimeAgo(tender.created_at),
    created_at: tender.created_at, // Preserve original timestamp for filtering
    lat: ensureValidCoordinates(tender.latitude, tender.longitude, locationData.city || '', tender.id)?.lat,
    lng: ensureValidCoordinates(tender.latitude, tender.longitude, locationData.city || '', tender.id)?.lng,
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

/** Treat as “no row” / invalid id — do not log as application error */
function isBenignJobOrTenderLookupError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  const code = String((error as PostgrestError).code ?? '');
  const msg = String(error.message ?? '').toLowerCase();
  if (code === 'PGRST116') return true;
  if (msg.includes('0 rows') || msg.includes('single json object')) return true;
  if (code === '22P02' || msg.includes('invalid input syntax for type uuid')) return true;
  return false;
}

/**
 * Fetch a single job by ID
 */
export async function fetchJobById(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<{ data: JobWithCompany | null; error: PostgrestError | null }> {
  const id = jobId?.trim();
  if (!id) {
    return { data: null, error: null };
  }
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
        ),
        subcategory:job_categories!jobs_subcategory_id_fkey (
          name,
          slug
        )
      `)
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on 0 rows

    // Handle "not found" error (PGRST116) as a normal case, not an error
    if (error) {
      // Check for PGRST116 in multiple ways since error structure can vary
      const errorCode = (error as PostgrestError).code || error?.code;
      if (
        errorCode === 'PGRST116' ||
        error.message?.includes('0 rows') ||
        error.message?.includes('single JSON object') ||
        isBenignJobOrTenderLookupError(error as PostgrestError)
      ) {
        // Job not found - this is expected, not an error
        return { data: null, error: null };
      }
      const e = error as PostgrestError;
      console.error('Error fetching job:', { message: e.message, code: e.code, details: e.details, hint: e.hint });
      return { data: null, error };
    }

    // If no data, job doesn't exist
    if (!data) {
      return { data: null, error: null };
    }

    // Calculate applications_count dynamically if job exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error: countsError } = await (supabase as any)
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', id);

    if (!countsError && count !== null) {
      data.applications_count = count;
    }

    return { data: data as JobWithCompany, error: null };
  } catch (err) {
    const error = err as PostgrestError | Error;
    // Handle "not found" error (PGRST116) as a normal case
    const errorCode = (error as PostgrestError)?.code || ((error as unknown as { error?: { code?: string } })?.error?.code);
    if (
      errorCode === 'PGRST116' ||
      error?.message?.includes('0 rows') ||
      error?.message?.includes('single JSON object') ||
      isBenignJobOrTenderLookupError(error as PostgrestError)
    ) {
      return { data: null, error: null };
    }
    const e = error as PostgrestError;
    console.error('Error fetching job:', { message: e.message, code: e.code, details: e.details, hint: e.hint });
    return { data: null, error: err };
  }
}

/**
 * Fetch a single tender by ID
 */
export async function fetchTenderById(
  supabase: SupabaseClient<Database>,
  tenderId: string
): Promise<{ data: TenderWithCompany | null; error: PostgrestError | null }> {
  const id = tenderId?.trim();
  if (!id) {
    return { data: null, error: null };
  }
  try {
    // Type assertion needed as tenders table may not be in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on 0 rows

    // Handle "not found" error (PGRST116) as a normal case, not an error
    if (result.error) {
      // Check for PGRST116 in multiple ways since error structure can vary
      const errorCode = result.error.code || result.error?.code;
      if (
        errorCode === 'PGRST116' ||
        result.error.message?.includes('0 rows') ||
        result.error.message?.includes('single JSON object') ||
        isBenignJobOrTenderLookupError(result.error as PostgrestError)
      ) {
        // Tender not found - this is expected, not an error
        return { data: null, error: null };
      }
      const e = result.error as PostgrestError;
      console.error('Error fetching tender:', { message: e.message, code: e.code, details: e.details, hint: e.hint });
      return { data: null, error: result.error };
    }

    // If no data, tender doesn't exist
    if (!result.data) {
      return { data: null, error: null };
    }

    // Calculate bids_count dynamically if tender exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error: countsError } = await (supabase as any)
      .from('tender_bids')
      .select('*', { count: 'exact', head: true })
      .eq('tender_id', id);

    if (!countsError && count !== null && result.data) {
      (result.data as unknown as { bids_count?: number }).bids_count = count;
    }

    return { data: result.data as unknown as TenderWithCompany, error: null };
  } catch (err) {
    const error = err as PostgrestError | Error;
    // Handle "not found" error (PGRST116) as a normal case
    const errorCode = (error as PostgrestError)?.code || ((error as unknown as { error?: { code?: string } })?.error?.code);
    if (
      errorCode === 'PGRST116' ||
      error?.message?.includes('0 rows') ||
      error?.message?.includes('single JSON object') ||
      isBenignJobOrTenderLookupError(error as PostgrestError)
    ) {
      return { data: null, error: null };
    }
    const e = error as PostgrestError;
    console.error('Error fetching tender:', { message: e.message, code: e.code, details: e.details, hint: e.hint });
    return { data: null, error: err };
  }
}

/**
 * Increment views_count for a job
 */
export async function incrementJobViews(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<{ data: { views_count: number } | null; error: PostgrestError | null }> {
  try {
    // Fetch current views_count
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('views_count')
      .eq('id', jobId)
      .single();

    // Handle "not found" error (PGRST116) - job doesn't exist
      if (fetchError && (fetchError as PostgrestError).code === 'PGRST116') {
      return { data: null, error: new Error('Job not found') as PostgrestError };
    }

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!currentJob) {
      return { data: null, error: new Error('Job not found') as PostgrestError };
    }

    const newViewsCount = (currentJob.views_count || 0) + 1;

    // Increment and update
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ views_count: newViewsCount })
      .eq('id', jobId);

    if (updateError) {
      return { data: null, error: updateError };
    }

    return { data: { views_count: newViewsCount }, error: null };
  } catch (err) {
    console.error('Error incrementing job views:', err);
    return { data: null, error: err };
  }
}

/**
 * Increment views_count for a tender
 */
export async function incrementTenderViews(
  supabase: SupabaseClient<Database>,
  tenderId: string
): Promise<{ data: { views_count: number } | null; error: PostgrestError | null }> {
  try {
    // Fetch current views_count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentTender, error: fetchError } = await (supabase as any)
      .from('tenders')
      .select('views_count')
      .eq('id', tenderId)
      .single();

    // Handle "not found" error (PGRST116) - tender doesn't exist
    if (fetchError && (fetchError as PostgrestError).code === 'PGRST116') {
      return { data: null, error: new Error('Tender not found') as PostgrestError };
    }

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!currentTender) {
      return { data: null, error: new Error('Tender not found') as PostgrestError };
    }

    const newViewsCount = ((currentTender as unknown as { views_count?: number })?.views_count || 0) + 1;

    // Increment and update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('tenders')
      .update({ views_count: newViewsCount })
      .eq('id', tenderId);

    if (updateError) {
      return { data: null, error: updateError };
    }

    return { data: { views_count: newViewsCount }, error: null };
  } catch (err) {
    console.error('Error incrementing tender views:', err);
    return { data: null, error: err };
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
    location: JobLocation | string; // Can be object or string for backward compatibility
    estimatedValue: string;
    currency: string;
    submissionDeadline: Date;
    evaluationDeadline: Date;
    requirements: string[];
    evaluationCriteria: Array<Record<string, unknown>>;
    documents?: Array<Record<string, unknown>>;
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
): Promise<{ data: TenderWithCompany | null; error: PostgrestError | null }> {
  try {
    // Map form category names to database category names
    const categoryMapping: Record<string, string> = {
      'Utrzymanie Czystości i Zieleni': 'Usługi Sprzątające',
      'Roboty Remontowo-Budowlane': 'Remonty i Budownictwo',
      'Instalacje i systemy': 'Instalacje Techniczne',
      'Utrzymanie techniczne i konserwacja': 'Zarządzanie Nieruchomościami',
      'Specjalistyczne usługi': 'Zarządzanie Nieruchomościami',
      'Inne': 'Zarządzanie Nieruchomościami',
    };

    // List of predefined categories from the form
    const predefinedCategories = [
      'Utrzymanie Czystości i Zieleni',
      'Roboty Remontowo-Budowlane',
      'Instalacje i systemy',
      'Utrzymanie techniczne i konserwacja',
      'Specjalistyczne usługi',
      'Inne'
    ];

    // Check if this is a custom category (not in predefined list)
    const isCustomCategory = !predefinedCategories.includes(tenderData.category);
    
    let categoryData: { id: string; name: string; slug: string } | null = null;
    let categoryError: PostgrestError | null = null;

    // For custom categories, try to find/create category with the exact custom name first
    // For predefined categories, use the mapped name
    if (isCustomCategory) {
      // First, try exact match with the custom category name (case-insensitive)
      const { data: customMatch, error: customError } = await (supabase as unknown as SupabaseClient<Database>)
        .from('job_categories')
        .select('id, name, slug')
        .ilike('name', tenderData.category)
        .eq('is_active', true)
        .maybeSingle();

      if (!customError && customMatch) {
        categoryData = customMatch;
        categoryError = null;
      } else {
        // If custom category doesn't exist, try partial match
        const { data: partialCustomMatch, error: partialCustomError } = await supabase
          .from('job_categories')
          .select('id, name, slug')
          .ilike('name', `%${tenderData.category}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!partialCustomError && partialCustomMatch) {
          categoryData = partialCustomMatch;
          categoryError = null;
        }
      }
    }

    // If custom category search failed or it's a predefined category, use mapped name
    if (categoryError || !categoryData) {
      const searchCategoryName = categoryMapping[tenderData.category] || 
        (isCustomCategory ? 'Zarządzanie Nieruchomościami' : tenderData.category);

      // Try exact match with mapped name
      const { data: mappedMatch, error: mappedError } = await supabase
        .from('job_categories')
        .select('id, name, slug')
        .ilike('name', searchCategoryName)
        .eq('is_active', true)
        .maybeSingle();

      if (!mappedError && mappedMatch) {
        categoryData = mappedMatch;
        categoryError = null;
      } else {
        // If exact match fails, try partial match
        const { data: partialMatch, error: partialError } = await supabase
          .from('job_categories')
          .select('id, name, slug')
          .ilike('name', `%${searchCategoryName}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!partialError && partialMatch) {
          categoryData = partialMatch;
          categoryError = null;
        }
      }
    }

    if (categoryError || !categoryData) {
      console.error('Error finding category:', {
        error: categoryError,
        searchedCategory: tenderData.category,
        isCustomCategory,
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
        error: new Error(`Category "${tenderData.category}" not found. Available categories: ${allCategories?.map((c: { name: string }) => c.name).join(', ') || 'none'}`) as PostgrestError
      };
    }

    const categoryId = categoryData.id;
    // Note: For custom categories, if a category with the exact custom name exists in the database,
    // it will be used and the name is preserved. If it doesn't exist, we fall back to a mapped category.
    // The category name stored in the database will be what we found/used.

    // Prepare documents JSONB
    const documentsJson = tenderData.documents ? tenderData.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      // Note: File objects can't be stored directly, they need to be uploaded first
      // For now, we'll store metadata only
    })) : null;

    // Prepare location as JSONB object (same format as jobs)
    let locationJsonb: { city: string; sublocality_level_1?: string };
    if (typeof tenderData.location === 'string') {
      // If location is a string, convert to object format
      locationJsonb = {
        city: tenderData.location
      };
    } else {
      // If location is already an object, use it directly
      locationJsonb = tenderData.location;
    }

    // Insert tender
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedTender, error: insertError } = await (supabase as any)
        .from('tenders')
      .insert({
        title: tenderData.title,
        description: tenderData.description,
        category_id: categoryId,
        manager_id: tenderData.managerId,
        company_id: tenderData.companyId,
        location: locationJsonb,
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
      console.error('Error creating tender:', {
        error: insertError,
        errorMessage: insertError?.message,
        errorDetails: insertError?.details,
        errorHint: insertError?.hint,
        errorCode: insertError?.code,
        tenderData: {
          title: tenderData.title,
          category: tenderData.category,
          categoryId: categoryId,
          location: tenderData.location,
        }
      });
      return { 
        data: null, 
        error: (insertError instanceof Error 
          ? insertError 
          : new Error(String((insertError as unknown as { message?: string; details?: string; hint?: string })?.message || (insertError as unknown as { message?: string; details?: string; hint?: string })?.details || (insertError as unknown as { message?: string; details?: string; hint?: string })?.hint || 'Unknown database error'))) as PostgrestError
      };
    }

    return { data: insertedTender as unknown as TenderWithCompany, error: null };
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
    evaluationCriteria: Array<Record<string, unknown>>;
    documents?: Array<Record<string, unknown>>;
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
): Promise<{ data: TenderWithCompany | null; error: PostgrestError | null }> {
  try {
    // First, verify the tender exists and is in draft status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingTender, error: fetchError } = await (supabase as any)
      .from('tenders')
      .select('id, status')
      .eq('id', tenderId)
      .single();

    if (fetchError || !existingTender) {
      return { 
        data: null, 
        error: new Error('Przetarg nie został znaleziony') as PostgrestError 
      };
    }

    if ((existingTender as unknown as { status?: string })?.status !== 'draft') {
      return { 
        data: null, 
        error: new Error('Tylko przetargi w statusie szkicu mogą być edytowane') as PostgrestError 
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
      const { data: allCategories } = await supabase
        .from('job_categories')
        .select('name, slug')
        .eq('is_active', true)
        .limit(20);
      
      console.error('Available categories:', allCategories);
      
      return { 
        data: null, 
        error: new Error(`Category "${tenderData.category}" not found. Available categories: ${allCategories?.map((c: { name: string }) => c.name).join(', ') || 'none'}`) as PostgrestError
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    return { data: updatedTender as unknown as TenderWithCompany, error: null };
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
    location?: JobLocation | string;
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
    buildingId?: string | null;
  }
): Promise<{ data: JobWithCompany | null; error: PostgrestError | null }> {
  try {
    const resolved = await resolveJobFormCategoryIds(supabase, jobData.category, jobData.subcategory);
    if (resolved.error || !resolved.categoryId) {
      return { data: null, error: resolved.error };
    }
    const categoryId = resolved.categoryId;
    const subcategoryId = resolved.subcategoryId;

    // Parse deadline if provided
    let deadlineDate: string | null = null;
    if (jobData.deadline) {
      if (typeof jobData.deadline === 'string') {
        deadlineDate = jobData.deadline;
      } else {
        deadlineDate = jobData.deadline.toISOString().split('T')[0];
      }
    }

    // Parse budget values using Budget type
    const budgetInput: BudgetInput = {
      min: jobData.budgetMin,
      max: jobData.budgetMax,
      type: jobData.budgetType || 'fixed',
      currency: jobData.currency || 'PLN',
    };
    const budgetDb = budgetToDatabase(budgetInput);

    const { fetchUserPrimaryCompany } = await import('./companies');
    const { data: companyRow } = await fetchUserPrimaryCompany(supabase, jobData.managerId);

    let locationJsonb: { city: string; sublocality_level_1?: string };
    let latitudeVal: number | null = jobData.latitude ?? null;
    let longitudeVal: number | null = jobData.longitude ?? null;
    let addressVal: string | null = jobData.address ?? null;

    if (jobData.buildingId) {
      const loc = await resolveJobLocationFromBuildingOrCompany(
        supabase,
        jobData.companyId,
        jobData.buildingId,
        companyRow?.city ?? null,
        companyRow?.address ?? null,
      );
      locationJsonb = { city: loc.city };
      latitudeVal = loc.latitude;
      longitudeVal = loc.longitude;
      addressVal = loc.address;
    } else if (jobData.location !== undefined && jobData.location !== null && jobData.location !== '') {
      if (typeof jobData.location === 'string') {
        locationJsonb = {
          city: jobData.location,
          ...(jobData.sublocalityLevel1 ? { sublocality_level_1: jobData.sublocalityLevel1 } : {}),
        };
      } else {
        locationJsonb = {
          city: jobData.location.city,
          ...(jobData.location.sublocality_level_1 || jobData.sublocalityLevel1
            ? { sublocality_level_1: jobData.location.sublocality_level_1 || jobData.sublocalityLevel1 }
            : {}),
        };
      }
    } else {
      const loc = await resolveJobLocationFromBuildingOrCompany(
        supabase,
        jobData.companyId,
        null,
        companyRow?.city ?? null,
        companyRow?.address ?? null,
      );
      locationJsonb = { city: loc.city };
      latitudeVal = loc.latitude;
      longitudeVal = loc.longitude;
      addressVal = loc.address;
    }

    // Prepare insert data
    const insertData = {
      title: jobData.title,
      description: jobData.description,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      building_id: jobData.buildingId ?? null,
      manager_id: jobData.managerId,
      company_id: jobData.companyId,
      location: locationJsonb,
      address: addressVal,
      latitude: latitudeVal,
      longitude: longitudeVal,
      budget_min: budgetDb.budget_min,
      budget_max: budgetDb.budget_max,
      budget_type: budgetDb.budget_type,
      currency: budgetDb.currency,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedJob, error: insertError } = await (supabase as any)
      .from('jobs')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertData as any)
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

    return { data: insertedJob as JobWithCompany, error: null };
  } catch (err) {
    console.error('Error creating job:', err);
    return { data: null, error: err };
  }
}

/**
 * Convert estimated completion string to days
 * Examples: "1 miesiąc" -> 30, "2 tygodnie" -> 14, "1-3 dni" -> 2, "2-4 tygodnie" -> 21
 */
function convertEstimatedCompletionToDays(estimatedCompletion: string): number | null {
  if (!estimatedCompletion) return null;
  
  const lower = estimatedCompletion.toLowerCase().trim();
  
  // Handle ranges with units (e.g., "2-4 tygodnie", "1-3 dni")
  if (lower.includes('-')) {
    // Detect unit first
    let unitMultiplier = 1;
    let unitKeyword = '';
    
    if (lower.includes('dzień') || lower.includes('dni')) {
      unitMultiplier = 1;
      unitKeyword = lower.includes('dzień') ? 'dzień' : 'dni';
    } else if (lower.includes('tydzień') || lower.includes('tygodni')) {
      unitMultiplier = 7;
      unitKeyword = lower.includes('tydzień') ? 'tydzień' : 'tygodni';
    } else if (lower.includes('miesiąc') || lower.includes('miesięcy')) {
      unitMultiplier = 30;
      unitKeyword = lower.includes('miesiąc') ? 'miesiąc' : 'miesięcy';
    }
    
    // If unit found, extract numbers from range
    if (unitKeyword) {
      // Remove unit keyword and extract numbers
      const withoutUnit = lower.replace(new RegExp(unitKeyword, 'g'), '').trim();
      const parts = withoutUnit.split('-').map(p => p.trim());
      
      if (parts.length === 2) {
        const first = parseInt(parts[0]);
        const second = parseInt(parts[1]);
        if (!isNaN(first) && !isNaN(second)) {
          const average = Math.round((first + second) / 2);
          return average * unitMultiplier;
        }
      }
    } else {
      // Range without unit - try to parse as plain numbers
      const parts = lower.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const first = parseInt(parts[0]);
        const second = parseInt(parts[1]);
        if (!isNaN(first) && !isNaN(second)) {
          return Math.round((first + second) / 2);
        }
      }
    }
  }
  
  // Handle specific time periods (non-range)
  if (lower.includes('dzień') || lower.includes('dni')) {
    const days = parseInt(lower);
    return isNaN(days) ? null : days;
  }
  
  if (lower.includes('tydzień') || lower.includes('tygodni')) {
    const weeks = parseInt(lower);
    return isNaN(weeks) ? null : weeks * 7;
  }
  
  if (lower.includes('miesiąc') || lower.includes('miesięcy')) {
    const months = parseInt(lower);
    return isNaN(months) ? null : months * 30;
  }
  
  // Try to extract number
  const number = parseInt(lower);
  return isNaN(number) ? null : number;
}

/**
 * Create a new job application
 */
export async function createJobApplication(
  supabase: SupabaseClient<Database>,
  jobId: string,
  contractorId: string,
  applicationData: {
    proposedPrice: number;
    estimatedCompletion: string;
    coverLetter: string;
    additionalNotes?: string;
  }
): Promise<{ data: Record<string, unknown> | null; error: PostgrestError | null }> {
  try {
    // Fetch contractor's primary company
    const { fetchUserPrimaryCompany } = await import('./companies');
    const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, contractorId);
    
    if (companyError) {
      console.error('Error fetching contractor company:', companyError);
      return { 
        data: null, 
        error: (companyError instanceof Error 
          ? companyError 
          : new Error(((companyError as unknown as { message?: string })?.message || 'Failed to fetch contractor company') as string)) as PostgrestError
      };
    }
    
    if (!company) {
      return { 
        data: null, 
        error: new Error('Contractor must have a company to submit applications') as PostgrestError
      };
    }
    
    // Convert estimated completion to days
    const proposedTimeline = convertEstimatedCompletionToDays(applicationData.estimatedCompletion);
    
    // Ensure proposed_price is a valid number
    const proposedPrice = typeof applicationData.proposedPrice === 'number' 
      ? applicationData.proposedPrice 
      : parseFloat(String(applicationData.proposedPrice)) || 0;
    
    if (proposedPrice <= 0) {
      return {
        data: null,
        error: new Error('Proposed price must be greater than 0') as PostgrestError
      };
    }
    
    // Validate required fields
    if (!applicationData.coverLetter || applicationData.coverLetter.trim().length === 0) {
      return {
        data: null,
        error: new Error('Cover letter is required') as PostgrestError
      };
    }
    
    // Prepare insert data
    const insertData: Record<string, unknown> = {
      job_id: jobId,
      contractor_id: contractorId,
      company_id: company.id,
      proposed_price: proposedPrice,
      currency: 'PLN',
      cover_letter: applicationData.coverLetter.trim(),
      notes: applicationData.additionalNotes?.trim() || null,
      status: 'submitted',
    };
    
    // Only add proposed_timeline if we successfully converted it
    if (proposedTimeline !== null) {
      insertData.proposed_timeline = proposedTimeline;
    }
    
    // Log the data being inserted for debugging
    console.log('Inserting job application with data:', {
      job_id: jobId,
      contractor_id: contractorId,
      company_id: company.id,
      proposed_price: applicationData.proposedPrice,
      proposed_timeline: proposedTimeline,
      cover_letter_length: applicationData.coverLetter?.length || 0,
      status: 'submitted'
    });
    
    // Insert application (using type assertion since job_applications may not be in generated types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedApplication, error: insertError } = await (supabase as any)
      .from('job_applications')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      const error = insertError as { message?: string; details?: string; hint?: string; code?: string };
      console.error('Error creating job application:', {
        error: insertError,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code,
        insertData: insertData,
        applicationData: {
          jobId,
          contractorId,
          companyId: company.id,
        }
      });
      return { 
        data: null, 
        error: (insertError instanceof Error 
          ? insertError 
          : new Error(((insertError as unknown as { message?: string; details?: string; hint?: string })?.message || (insertError as unknown as { message?: string; details?: string; hint?: string })?.details || (insertError as unknown as { message?: string; details?: string; hint?: string })?.hint || 'Unknown database error') as string)) as PostgrestError
      };
    }
    
    // Verify that data was actually inserted
    if (!insertedApplication || !(insertedApplication as unknown as { id?: string })?.id) {
      console.error('Application insert returned no data:', {
        insertedApplication,
        insertData
      });
      return {
        data: null,
        error: new Error('Application was not created - no data returned from database') as PostgrestError
      };
    }
    
    console.log('Job application created successfully:', {
      id: (insertedApplication as unknown as JobApplicationRow)?.id,
      job_id: (insertedApplication as unknown as JobApplicationRow)?.job_id,
      contractor_id: (insertedApplication as unknown as JobApplicationRow)?.contractor_id,
      company_id: (insertedApplication as unknown as JobApplicationRow)?.company_id,
      status: (insertedApplication as unknown as JobApplicationRow)?.status
    });
    return { data: insertedApplication as unknown as JobApplicationRow, error: null };
  } catch (err) {
    console.error('Error creating job application:', err);
    return { 
      data: null, 
      error: (err instanceof Error 
        ? err 
        : new Error(((err as unknown as { message?: string })?.message || String(err) || 'Unknown error occurred') as string)) as PostgrestError
    };
  }
}

/**
 * Fetch job applications for a specific job
 */
export async function fetchJobApplicationsByJobId(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<{ data: Application[] | null; error: PostgrestError | null }> {
  try {
    // Use type assertion since job_applications may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: applications, error } = await (supabase as any)
      .from('job_applications')
      .select(`
        id,
        job_id,
        contractor_id,
        proposed_price,
        proposed_timeline,
        cover_letter,
        experience,
        team_size,
        available_from,
        guarantee_period,
        status,
        notes,
        attachments,
        certificates,
        submitted_at,
        reviewed_at,
        decision_at,
        contractor:user_profiles!job_applications_contractor_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        company:companies!job_applications_company_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .eq('job_id', jobId)
      .neq('admin_moderation_status', 'suspended')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching job applications:', error);
      return { data: null, error };
    }
    
    // Transform to Application type format
    const formattedApplications = await Promise.all(
      ((applications as JobApplicationRow[]) || []).map(async (app: JobApplicationRow) => {
        // Fetch contractor profile for additional data (rating, completed jobs, location)
        const { fetchContractorById } = await import('./contractors');
        const contractorProfile = await fetchContractorById(String((app.company as Record<string, unknown>)?.id ?? ''));
        
        // Convert proposed_timeline (days) back to readable string
        let proposedTimeline = 'Nie określono';
        if (app.proposed_timeline) {
          const days = Number(app.proposed_timeline);
          if (days < 7) {
            proposedTimeline = `${days} ${days === 1 ? 'dzień' : 'dni'}`;
          } else if (days < 30) {
            const weeks = Math.round(days / 7);
            proposedTimeline = `${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'}`;
          } else {
            const months = Math.round(days / 30);
            proposedTimeline = `${months} ${months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}`;
          }
        }
        
        const formattedAttachments = Array.isArray(app.attachments)
          ? (app.attachments as Array<Record<string, unknown>>).map((attachment, index) => ({
              id: String(attachment.id ?? `attachment-${index}`),
              name: String(attachment.name ?? 'Załącznik'),
              type:
                (attachment.type === 'portfolio' ||
                  attachment.type === 'reference' ||
                  attachment.type === 'certificate' ||
                  attachment.type === 'other'
                  ? attachment.type
                  : 'other') as 'portfolio' | 'reference' | 'certificate' | 'other',
              url: String(attachment.url ?? ''),
              size: Number(attachment.size ?? 0),
            }))
          : [];

        return {
          id: String(app.id),
          jobId: String(app.job_id),
          contractorId: String(app.contractor_id),
          contractorCompanyId: String((app.company as Record<string, unknown>)?.id ?? ''),
          contractorName: app.contractor 
            ? `${String((app.contractor as Record<string, unknown>).first_name ?? '')} ${String((app.contractor as Record<string, unknown>).last_name ?? '')}`.trim() 
            : 'Nieznany wykonawca',
          contractorCompany: String((app.company as Record<string, unknown>)?.name ?? 'Nieznana firma'),
          contractorAvatar: String((app.contractor as Record<string, unknown>)?.avatar_url ?? (app.company as Record<string, unknown>)?.logo_url ?? ''),
          contractorRating: contractorProfile?.rating?.overall || 0,
          contractorCompletedJobs: contractorProfile?.experience?.completedProjects || 0,
          contractorLocation: contractorProfile?.location?.city || 'Nieznana lokalizacja',
          proposedPrice: Number(app.proposed_price ?? 0),
          proposedTimeline: proposedTimeline,
          coverLetter: String(app.cover_letter ?? ''),
          experience: String(app.experience ?? ''),
          teamSize: Number(app.team_size ?? 1),
          availableFrom: String(app.available_from ?? new Date().toISOString()),
          guaranteePeriod: app.guarantee_period ? `${String(app.guarantee_period)} miesięcy` : '12 miesięcy',
          attachments: formattedAttachments,
          certificates: Array.isArray(app.certificates) ? app.certificates.map((certificate) => String(certificate)) : [],
          status: (app.status as 'submitted' | 'under_review' | 'accepted' | 'rejected') || 'submitted',
          submittedAt: new Date(String(app.submitted_at ?? '')),
          lastUpdated: app.reviewed_at ? new Date(String(app.reviewed_at)) : new Date(String(app.submitted_at ?? '')),
          reviewNotes: typeof app.notes === 'string' ? app.notes : undefined,
        };
      })
    );
    
    return { data: formattedApplications, error: null };
  } catch (err) {
    console.error('Error fetching job applications:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a new tender bid
 */
export async function createTenderBid(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  contractorId: string,
  bidData: {
    proposedPrice: number;
    estimatedCompletion: string;
    coverLetter: string;
    additionalNotes?: string;
  }
): Promise<{ data: Record<string, unknown> | null; error: PostgrestError | null }> {
  try {
    // Fetch contractor's primary company
    const { fetchUserPrimaryCompany } = await import('./companies');
    const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, contractorId);
    
    if (companyError) {
      console.error('Error fetching contractor company:', companyError);
      return { 
        data: null, 
        error: (companyError instanceof Error 
          ? companyError 
          : new Error(((companyError as unknown as { message?: string })?.message || 'Failed to fetch contractor company') as string)) as PostgrestError
      };
    }
    
    if (!company) {
      return { 
        data: null, 
        error: new Error('Contractor must have a company to submit bids') as PostgrestError
      };
    }
    
    // Check if a non-cancelled bid already exists for this tender and company
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBids, error: checkError } = await (supabase as any)
      .from('tender_bids')
      .select('id, status')
      .eq('tender_id', tenderId)
      .eq('company_id', company.id)
      .neq('status', 'cancelled')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking for existing bids:', checkError);
      return {
        data: null,
        error: new Error('Failed to check for existing bids') as PostgrestError
      };
    }
    
    if (existingBids && existingBids.length > 0) {
      return {
        data: null,
        error: new Error('Już złożyłeś ofertę na ten przetarg. Nie możesz złożyć więcej niż jednej oferty na ten sam przetarg.') as PostgrestError
      };
    }
    
    // Convert estimated completion to days
    const proposedTimeline = convertEstimatedCompletionToDays(bidData.estimatedCompletion);
    
    // Prepare insert data
    const insertData: Record<string, unknown> = {
      tender_id: tenderId,
      contractor_id: contractorId,
      company_id: company.id,
      bid_amount: bidData.proposedPrice,
      currency: 'PLN',
      technical_proposal: bidData.coverLetter,
      financial_proposal: bidData.additionalNotes || null,
      status: 'submitted',
    };
    
    // Only add proposed_timeline if we successfully converted it
    if (proposedTimeline !== null) {
      insertData.proposed_timeline = proposedTimeline;
    }
    
    // Insert bid (using type assertion since tender_bids may not be in generated types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedBid, error: insertError } = await (supabase as any)
      .from('tender_bids')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      const error = insertError as { message?: string; details?: string; hint?: string; code?: string };
      console.error('Error creating tender bid:', {
        error: insertError,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code,
        bidData: {
          tenderId,
          contractorId,
          companyId: company.id,
        }
      });
      return { 
        data: null, 
        error: (insertError instanceof Error 
          ? insertError 
          : new Error(((insertError as unknown as { message?: string; details?: string; hint?: string })?.message || (insertError as unknown as { message?: string; details?: string; hint?: string })?.details || (insertError as unknown as { message?: string; details?: string; hint?: string })?.hint || 'Unknown database error') as string)) as PostgrestError
      };
    }
    
    return { data: insertedBid as unknown as TenderBidRow, error: null };
  } catch (err) {
    console.error('Error creating tender bid:', err);
    return { 
      data: null, 
      error: (err instanceof Error 
        ? err 
        : new Error(((err as unknown as { message?: string })?.message || String(err) || 'Unknown error occurred') as string)) as PostgrestError
    };
  }
}

/**
 * Fetch tender bids for a specific tender
 */
export async function fetchTenderBidsByTenderId(
  supabase: SupabaseClient<Database>,
  tenderId: string
): Promise<{ data: Record<string, unknown>[] | null; error: PostgrestError | null }> {
  try {
    // Use type assertion since tender_bids may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bids, error } = await (supabase as any)
      .from('tender_bids')
      .select(`
        id,
        tender_id,
        contractor_id,
        bid_amount,
        proposed_timeline,
        proposed_start_date,
        technical_proposal,
        financial_proposal,
        team_description,
        experience_summary,
        project_references,
        certificates,
        attachments,
        status,
        evaluation_score,
        evaluation_notes,
        submitted_at,
        evaluated_at,
        contractor:user_profiles!tender_bids_contractor_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        company:companies!tender_bids_company_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .eq('tender_id', tenderId)
      .neq('admin_moderation_status', 'suspended')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tender bids:', error);
      return { data: null, error };
    }
    
    // Transform to TenderBid type format
    const formattedBids = await Promise.all(
      ((bids as TenderBidRow[]) || []).map(async (bid: TenderBidRow) => {
        // Fetch contractor profile for additional data
        const { fetchContractorById } = await import('./contractors');
        const contractorProfile = await fetchContractorById(String((bid.company as Record<string, unknown>)?.id ?? ''));
        
        // Convert proposed_timeline (days) to number
        const proposedTimeline = Number(bid.proposed_timeline ?? 0);
        
        return {
          id: bid.id,
          contractorCompanyId: String((bid.company as Record<string, unknown>)?.id ?? ''),
          contractorId: bid.contractor_id,
          contractorName: bid.contractor 
            ? `${String((bid.contractor as Record<string, unknown>).first_name ?? '')} ${String((bid.contractor as Record<string, unknown>).last_name ?? '')}`.trim() 
            : 'Nieznany wykonawca',
          contractorCompany: String((bid.company as Record<string, unknown>)?.name ?? 'Nieznana firma'),
          contractorAvatar: String((bid.contractor as Record<string, unknown>)?.avatar_url ?? (bid.company as Record<string, unknown>)?.logo_url ?? ''),
          contractorRating: contractorProfile?.rating?.overall || 0,
          contractorCompletedJobs: contractorProfile?.experience?.completedProjects || 0,
          totalPrice: bid.bid_amount || 0,
          currency: 'PLN',
          proposedTimeline: proposedTimeline,
          proposedStartDate: bid.proposed_start_date ? new Date(String(bid.proposed_start_date)) : new Date(),
          guaranteePeriod: 12, // Default, could be extracted from bid if available
          description: String(bid.technical_proposal ?? ''),
          technicalProposal: String(bid.technical_proposal ?? ''),
          attachments: (bid.attachments as Array<Record<string, unknown>>) || [],
          criteriaResponses: [], // Would need to be extracted from bid if stored separately
          submittedAt: new Date(String(bid.submitted_at ?? '')),
          status: (bid.status as 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded') || 'submitted',
          evaluation: bid.evaluation_score || bid.evaluation_notes ? {
            criteriaScores: {},
            totalScore: bid.evaluation_score || 0,
            evaluatorNotes: bid.evaluation_notes || '',
            evaluatedAt: bid.evaluated_at ? new Date(String(bid.evaluated_at)) : new Date(),
            evaluatorId: '',
          } : undefined,
        };
      })
    );
    
    return { data: formattedBids, error: null };
  } catch (err) {
    console.error('Error fetching tender bids:', err);
    return { data: null, error: err };
  }
}

/**
 * Cancel a job application (withdraw offer)
 * Only allows cancellation if status is not 'accepted' or 'rejected'
 */
export async function cancelJobApplication(
  supabase: SupabaseClient<Database>,
  applicationId: string,
  contractorId: string
): Promise<{ data: Record<string, unknown> | null; error: PostgrestError | null }> {
  try {
    // Fetch contractor's primary company
    const { fetchUserPrimaryCompany } = await import('./companies');
    const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, contractorId);
    
    if (companyError || !company) {
      return { 
        data: null, 
        error: new Error('Contractor must have a company to cancel applications') as PostgrestError
      };
    }

    // First, fetch the application to check ownership and current status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (supabase as any)
      .from('job_applications')
      .select('id, company_id, status')
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      console.error('Error fetching application:', fetchError);
      return {
        data: null,
        error: new Error('Application not found') as PostgrestError
      };
    }

    if (!application) {
      return {
        data: null,
        error: new Error('Application not found') as PostgrestError
      };
    }

    // Check that application belongs to contractor's company
    if ((application as unknown as { company_id?: string })?.company_id !== company.id) {
      return {
        data: null,
        error: new Error('You do not have permission to cancel this application') as PostgrestError
      };
    }

    // Check that status is not 'accepted' or 'rejected'
    if ((application as unknown as { status?: string })?.status === 'accepted' || (application as unknown as { status?: string })?.status === 'rejected') {
      return {
        data: null,
        error: new Error('Cannot cancel an application that has already been accepted or rejected') as PostgrestError
      };
    }

    // Update status to 'cancelled'
    // Filter by both contractor_id (for RLS policy) and company_id (for validation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updateData, error: updateError } = await (supabase as any)
      .from('job_applications')
      .update({ 
        status: 'cancelled',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('contractor_id', contractorId)
      .eq('company_id', company.id)
      .select();

    if (updateError) {
      console.error('Error updating application status:', {
        updateError,
        errorType: typeof updateError,
        errorMessage: updateError?.message,
        errorCode: updateError?.code,
        errorDetails: updateError?.details,
        errorHint: updateError?.hint,
        applicationId,
        companyId: company.id
      });
      
      // Extract error message from various error object structures
      const errorMessage = updateError instanceof Error 
        ? updateError.message 
        : ((updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.message || (updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.details || (updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.hint || (updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.code || 'Failed to cancel application') as string;
      
      return {
        data: null,
        error: new Error(errorMessage) as PostgrestError
      };
    }

    // Check if any rows were updated
    if (!updateData || updateData.length === 0) {
      return {
        data: null,
        error: new Error('Application not found or could not be updated. Make sure the database migration has been run to allow "cancelled" status.') as PostgrestError
      };
    }

    const data = (updateData as unknown as Array<Record<string, unknown>>)?.[0];

    return { data, error: null };
  } catch (err) {
    console.error('Error in cancelJobApplication:', err);
    return {
      data: null,
      error: (err instanceof Error 
        ? err 
        : new Error('An unexpected error occurred while cancelling the application')) as PostgrestError
    };
  }
}

/**
 * Cancel a tender bid (withdraw offer)
 * Only allows cancellation if status is not 'accepted' or 'rejected'
 */
export async function cancelTenderBid(
  supabase: SupabaseClient<Database>,
  bidId: string,
  contractorId: string
): Promise<{ data: Record<string, unknown> | null; error: PostgrestError | null }> {
  try {
    // Fetch contractor's primary company
    const { fetchUserPrimaryCompany } = await import('./companies');
    const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, contractorId);
    
    if (companyError || !company) {
      return { 
        data: null, 
        error: new Error('Contractor must have a company to cancel bids') as PostgrestError
      };
    }

    // First, fetch the bid to check ownership and current status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bid, error: fetchError } = await (supabase as any)
      .from('tender_bids')
      .select('id, company_id, status')
      .eq('id', bidId)
      .single();

    if (fetchError) {
      console.error('Error fetching bid:', fetchError);
      return {
        data: null,
        error: new Error('Bid not found') as PostgrestError
      };
    }

    if (!bid) {
      return {
        data: null,
        error: new Error('Bid not found') as PostgrestError
      };
    }

    // Check that bid belongs to contractor's company
    if ((bid as unknown as { company_id?: string })?.company_id !== company.id) {
      return {
        data: null,
        error: new Error('You do not have permission to cancel this bid') as PostgrestError
      };
    }

    // Check that status is not 'accepted' or 'rejected'
    if ((bid as unknown as { status?: string })?.status === 'accepted' || (bid as unknown as { status?: string })?.status === 'rejected') {
      return {
        data: null,
        error: new Error('Cannot cancel a bid that has already been accepted or rejected') as PostgrestError
      };
    }

    // Update status to 'cancelled'
    // Filter by both contractor_id (for RLS policy) and company_id (for validation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updateData, error: updateError } = await (supabase as any)
      .from('tender_bids')
      .update({ 
        status: 'cancelled',
        evaluated_at: new Date().toISOString()
      })
      .eq('id', bidId)
      .eq('contractor_id', contractorId)
      .eq('company_id', company.id)
      .select();

    if (updateError) {
      console.error('Error updating bid status:', {
        updateError,
        errorType: typeof updateError,
        errorMessage: updateError?.message,
        errorCode: updateError?.code,
        errorDetails: updateError?.details,
        errorHint: updateError?.hint,
        bidId,
        companyId: company.id
      });
      
      // Extract error message from various error object structures
      const errorMessage = updateError instanceof Error 
        ? updateError.message 
        : ((updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.message || (updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.details || (updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.hint || (updateError as unknown as { message?: string; details?: string; hint?: string; code?: string })?.code || 'Failed to cancel bid') as string;
      
      return {
        data: null,
        error: new Error(errorMessage) as PostgrestError
      };
    }

    // Check if any rows were updated
    if (!updateData || updateData.length === 0) {
      return {
        data: null,
        error: new Error('Bid not found or could not be updated. Make sure the database migration has been run to allow "cancelled" status.') as PostgrestError
      };
    }

    const data = (updateData as unknown as Array<Record<string, unknown>>)?.[0];

    return { data, error: null };
  } catch (err) {
    console.error('Error in cancelTenderBid:', err);
    return {
      data: null,
      error: (err instanceof Error 
        ? err 
        : new Error('An unexpected error occurred while cancelling the bid')) as PostgrestError
    };
  }
}

/**
 * Fetch jobs that have been worked on by contractors
 * (jobs with accepted applications)
 */
export async function fetchJobsByWorkHistory(
  supabase: SupabaseClient<Database>,
  managerCompanyId: string
): Promise<Array<{
  id: string;
  title: string;
  category: string;
  status: string;
  budget: string;
  applications: number;
  deadline: string;
  address: string;
}>> {
  try {
    if (!managerCompanyId) {
      return [];
    }

    // Step 1: Get all job IDs for this company
    const { data: companyJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', managerCompanyId);

    if (jobsError) {
      console.error('Error fetching company jobs:', jobsError);
      return [];
    }

    const jobIds = (companyJobs || []).map((job: { id: string }) => job.id);

    if (jobIds.length === 0) {
      return [];
    }

    // Step 2: Get accepted applications for these jobs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: acceptedApplications, error: appsError } = await (supabase as any)
      .from('job_applications')
      .select('job_id')
      .in('job_id', jobIds)
      .eq('status', 'accepted');

    if (appsError) {
      console.error('Error fetching accepted applications:', appsError);
      return [];
    }

    if (!acceptedApplications || (acceptedApplications as unknown as { length?: number })?.length === 0) {
      return [];
    }

    // Step 3: Get distinct job IDs that have accepted applications
    const jobIdsWithApplications: string[] = Array.from(new Set<string>(((acceptedApplications as JobApplicationRow[]) || []).map((app: JobApplicationRow) => app.job_id)));

    if (jobIdsWithApplications.length === 0) {
      return [];
    }

    // Step 4: Fetch job details for these jobs
    const { data: jobsData, error: jobsDataError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        budget_min,
        budget_max,
        budget_type,
        currency,
        deadline,
        status,
        location,
        created_at,
        job_categories!jobs_category_id_fkey (name)
      `)
      .in('id', jobIdsWithApplications)
      .order('created_at', { ascending: false });

    if (jobsDataError) {
      console.error('Error fetching jobs data:', jobsDataError);
      return [];
    }

    if (!jobsData || jobsData.length === 0) {
      return [];
    }

    // Step 5: Count accepted applications for each job
    const applicationCounts: { [key: string]: number } = {};
    for (const app of (acceptedApplications as JobApplicationRow[]) || []) {
      const jobId = (app as JobApplicationRow)?.job_id;
      if (jobId) {
        applicationCounts[jobId] = (applicationCounts[jobId] || 0) + 1;
      }
    }

    // Step 6: Format jobs for display
    const formattedJobs = jobsData.map((job: Record<string, unknown>) => {
      const location = typeof job.location === 'string' 
        ? job.location 
        : ((job.location as unknown as { city?: string })?.city || 'Nieznana lokalizacja') as string;

      // Format budget
      const budget = budgetFromDatabase({
        budget_min: (job.budget_min as number) ?? null,
        budget_max: (job.budget_max as number) ?? null,
        budget_type: ((job.budget_type || 'fixed') as string) as 'fixed' | 'hourly' | 'negotiable' | 'range',
        currency: (job.currency as string) || 'PLN',
      });
      const budgetStr = formatBudget(budget);

      return {
        id: job.id as string,
        title: job.title as string,
        category: (((job.job_categories as unknown as { name?: string })?.name as string) || 'Inne') as string,
        status: (job.status as string) || 'active',
        budget: budgetStr,
        applications: applicationCounts[job.id as string] || 0,
        deadline: (job.deadline as string) || '',
        address: location as string
      };
    });

    return formattedJobs;
  } catch (error) {
    console.error('Error in fetchJobsByWorkHistory:', error);
    return [];
  }
}



