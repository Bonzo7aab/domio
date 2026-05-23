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

  if (reviewData.jobId) {
    existingQuery = existingQuery.eq('job_id', reviewData.jobId);
  } else {
    existingQuery = existingQuery.is('job_id', null);
  }

  const { data: existingReview } = await existingQuery.maybeSingle();
  if (existingReview) {
    return {
      data: null,
      error: new Error(
        reviewData.jobId
          ? 'Opinia dla tego zgłoszenia została już dodana'
          : 'Opinia dla tej firmy została już dodana',
      ),
    };
  }

  const { data, error } = await supabase
    .from('company_reviews')
    .insert({
      company_id: companyId,
      reviewer_id: reviewerId,
      rating: reviewData.rating,
      title: reviewData.title?.trim() || null,
      comment: reviewData.comment.trim(),
      categories: reviewData.categories ?? null,
      job_id: reviewData.jobId ?? null,
      tender_id: reviewData.tenderId ?? null,
      image_urls: reviewData.imageUrls ?? [],
      is_public: true,
      is_verified: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating company review:', error);
    return { data: null, error: new Error('Nie udało się zapisać opinii') };
  }

  return { data: { id: data.id }, error: null };
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
  jobId: string | null;
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
      jobId: row.job_id,
    };
  });
}
