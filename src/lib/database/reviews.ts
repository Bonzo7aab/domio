import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export interface CompanyReviewInput {
  rating: number;
  comment: string;
  title?: string;
  categories?: Record<string, number>;
  jobId?: string;
  tenderId?: string;
  imageUrls?: string[];
}

export interface CompanyReviewRecord {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  imageUrls: string[];
  createdAt: string;
  companyId: string;
  jobId: string | null;
  tenderId: string | null;
}

export interface AcceptedContractorForJob {
  companyId: string;
  companyName: string;
  applicationId: string;
}

/**
 * Accepted contractor company for a job (manager rates service).
 */
export async function fetchAcceptedContractorForJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
): Promise<AcceptedContractorForJob | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('job_applications')
    .select(
      `
      id,
      company_id,
      companies!job_applications_company_id_fkey ( id, name )
    `,
    )
    .eq('job_id', jobId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    id: string;
    company_id: string;
    companies: { id: string; name: string } | null;
  };
  const company = row.companies;
  if (!company?.id) {
    return null;
  }

  return {
    companyId: company.id,
    companyName: company.name,
    applicationId: row.id,
  };
}

export async function fetchReviewByReviewerAndJob(
  supabase: SupabaseClient<Database>,
  reviewerId: string,
  jobId: string,
): Promise<CompanyReviewRecord | null> {
  const { data, error } = await supabase
    .from('company_reviews')
    .select('id, rating, title, comment, image_urls, created_at, company_id, job_id')
    .eq('reviewer_id', reviewerId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    imageUrls: Array.isArray(data.image_urls) ? data.image_urls : [],
    createdAt: data.created_at,
    companyId: data.company_id,
    jobId: data.job_id,
    tenderId: null,
  };
}

export async function fetchReviewByReviewerAndTender(
  supabase: SupabaseClient<Database>,
  reviewerId: string,
  tenderId: string,
): Promise<CompanyReviewRecord | null> {
  const { data, error } = await supabase
    .from('company_reviews')
    .select('id, rating, title, comment, image_urls, created_at, company_id, job_id, tender_id')
    .eq('reviewer_id', reviewerId)
    .eq('tender_id', tenderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    imageUrls: Array.isArray(data.image_urls) ? data.image_urls : [],
    createdAt: data.created_at,
    companyId: data.company_id,
    jobId: data.job_id,
    tenderId: data.tender_id,
  };
}

/**
 * Create a review for a company (contractor or manager), optionally scoped to a job.
 */
export async function createCompanyReview(
  supabase: SupabaseClient<Database>,
  companyId: string,
  reviewerId: string,
  reviewData: CompanyReviewInput,
): Promise<{ data: { id: string } | null; error: Error | null }> {
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    return { data: null, error: new Error('Ocena musi być od 1 do 5') };
  }
  if (!reviewData.comment.trim()) {
    return { data: null, error: new Error('Komentarz jest wymagany') };
  }

  let existingQuery = supabase
    .from('company_reviews')
    .select('id')
    .eq('company_id', companyId)
    .eq('reviewer_id', reviewerId);

  if (reviewData.tenderId) {
    existingQuery = existingQuery.eq('tender_id', reviewData.tenderId);
  } else if (reviewData.jobId) {
    existingQuery = existingQuery.eq('job_id', reviewData.jobId);
  } else {
    existingQuery = existingQuery.is('job_id', null).is('tender_id', null);
  }

  const { data: existingReview } = await existingQuery.maybeSingle();
  if (existingReview) {
    return {
      data: null,
      error: new Error(
        reviewData.tenderId
          ? 'Opinia o współpracy w tym konkursie została już dodana'
          : reviewData.jobId
            ? 'Opinia dla tego zlecenia została już dodana'
            : 'Opinia dla tej firmy została już dodana',
      ),
    };
  }

  const insertRow: Database['public']['Tables']['company_reviews']['Insert'] = {
    company_id: companyId,
    reviewer_id: reviewerId,
    rating: reviewData.rating,
    title: reviewData.title?.trim() || null,
    comment: reviewData.comment.trim(),
    categories: reviewData.categories ?? null,
    job_id: reviewData.jobId ?? null,
    tender_id: reviewData.tenderId ?? null,
    is_public: true,
    is_verified: false,
  };

  if (reviewData.imageUrls && reviewData.imageUrls.length > 0) {
    insertRow.image_urls = reviewData.imageUrls;
  }

  const { data, error } = await supabase
    .from('company_reviews')
    .insert(insertRow)
    .select('id')
    .single();

  if (error) {
    const message =
      error.message ||
      error.details ||
      error.hint ||
      'Nie udało się zapisać opinii';
    console.error('Error creating company review:', error);
    return { data: null, error: new Error(message) };
  }

  return { data: { id: data.id }, error: null };
}

export async function updateCompanyReview(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  reviewerId: string,
  reviewData: Pick<CompanyReviewInput, 'rating' | 'comment' | 'title'>,
): Promise<{ error: Error | null }> {
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    return { error: new Error('Ocena musi być od 1 do 5') };
  }
  if (!reviewData.comment.trim()) {
    return { error: new Error('Komentarz jest wymagany') };
  }

  const { error } = await supabase
    .from('company_reviews')
    .update({
      rating: reviewData.rating,
      comment: reviewData.comment.trim(),
      title: reviewData.title?.trim() || null,
    })
    .eq('id', reviewId)
    .eq('reviewer_id', reviewerId);

  if (error) {
    const message =
      error.message || error.details || error.hint || 'Nie udało się zapisać zmian';
    console.error('Error updating company review:', error);
    return { error: new Error(message) };
  }

  return { error: null };
}

/**
 * Tender IDs where the reviewer already submitted a cooperation review.
 */
export async function fetchReviewedTenderIdsForReviewer(
  supabase: SupabaseClient<Database>,
  reviewerId: string,
  tenderIds: string[],
): Promise<Set<string>> {
  if (tenderIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from('company_reviews')
    .select('tender_id')
    .eq('reviewer_id', reviewerId)
    .in('tender_id', tenderIds);

  if (error || !data) {
    return new Set();
  }

  return new Set(
    data.map((row) => row.tender_id).filter((id): id is string => typeof id === 'string'),
  );
}

export async function updateReviewImageUrls(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  imageUrls: string[],
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('company_reviews')
    .update({ image_urls: imageUrls })
    .eq('id', reviewId);

  if (error) {
    return { error: new Error('Nie udało się zapisać zdjęć') };
  }
  return { error: null };
}

export interface WrittenReviewListItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls: string[];
  createdAt: string;
  counterpartyName: string;
  counterpartyCompanyId: string;
  jobId: string | null;
  tenderId: string | null;
}

export async function fetchReviewsWrittenByUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<WrittenReviewListItem[]> {
  const { data, error } = await supabase
    .from('company_reviews')
    .select(
      `
      id,
      rating,
      title,
      comment,
      image_urls,
      created_at,
      job_id,
      tender_id,
      company_id,
      companies!company_reviews_company_id_fkey ( name )
    `,
    )
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const company = row.companies as { name: string } | null;
    return {
      id: row.id,
      rating: row.rating,
      title: row.title || '',
      comment: row.comment || '',
      imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
      createdAt: row.created_at,
      counterpartyName: company?.name || 'Firma',
      counterpartyCompanyId: row.company_id,
      jobId: row.job_id,
      tenderId: row.tender_id,
    };
  });
}
