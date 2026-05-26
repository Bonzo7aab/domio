import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import {
  fetchJobApplicationsByJobId,
  fetchTenderBidsByTenderId,
  updateManagerJobWorkflowStatus,
} from './jobs';

export interface AcceptOfferResult {
  success: boolean;
  error?: string;
}

async function verifyJobOwnership(
  supabase: SupabaseClient<Database>,
  jobId: string,
  managerId: string,
  companyId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, manager_id, company_id')
    .eq('id', jobId)
    .maybeSingle();

  if (error || !job) {
    return { ok: false, error: 'Nie znaleziono zgłoszenia' };
  }
  if (job.manager_id !== managerId) {
    return { ok: false, error: 'Brak uprawnień' };
  }
  if (job.company_id !== companyId) {
    return { ok: false, error: 'Zgłoszenie nie należy do tej firmy' };
  }
  return { ok: true };
}

async function verifyTenderOwnership(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  managerId: string,
  companyId: string,
): Promise<{ ok: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tender, error } = await (supabase as any)
    .from('tenders')
    .select('id, manager_id, company_id')
    .eq('id', tenderId)
    .maybeSingle();

  if (error || !tender) {
    return { ok: false, error: 'Nie znaleziono przetargu' };
  }
  if (tender.manager_id !== managerId) {
    return { ok: false, error: 'Brak uprawnień' };
  }
  if (tender.company_id !== companyId) {
    return { ok: false, error: 'Przetarg nie należy do tej firmy' };
  }
  return { ok: true };
}

/**
 * Manager selects a job offer: accept one application, reject other open ones, move job to in_progress.
 */
export async function acceptManagerJobOffer(
  supabase: SupabaseClient<Database>,
  params: {
    jobId: string;
    applicationId: string;
    managerId: string;
    companyId: string;
  },
): Promise<AcceptOfferResult> {
  const jobId = params.jobId.trim();
  const applicationId = params.applicationId.trim();

  const ownership = await verifyJobOwnership(
    supabase,
    jobId,
    params.managerId,
    params.companyId,
  );
  if (!ownership.ok) {
    return { success: false, error: ownership.error };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: application, error: appErr } = await (supabase as any)
    .from('job_applications')
    .select('id, job_id, status')
    .eq('id', applicationId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (appErr || !application) {
    return { success: false, error: 'Nie znaleziono oferty' };
  }

  if (application.status === 'accepted') {
    return { success: true };
  }

  if (application.status === 'rejected' || application.status === 'cancelled') {
    return { success: false, error: 'Tej oferty nie można wybrać' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingAccepted } = await (supabase as any)
    .from('job_applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (existingAccepted && existingAccepted.id !== applicationId) {
    return { success: false, error: 'To zgłoszenie ma już wybraną ofertę' };
  }

  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: acceptErr } = await (supabase as any)
    .from('job_applications')
    .update({
      status: 'accepted',
      reviewed_at: now,
      decision_at: now,
    })
    .eq('id', applicationId)
    .eq('job_id', jobId);

  if (acceptErr) {
    return {
      success: false,
      error: acceptErr.message || 'Nie udało się zaakceptować oferty',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rejectErr } = await (supabase as any)
    .from('job_applications')
    .update({
      status: 'rejected',
      reviewed_at: now,
      decision_at: now,
    })
    .eq('job_id', jobId)
    .neq('id', applicationId)
    .in('status', ['submitted', 'under_review', 'shortlisted']);

  if (rejectErr) {
    console.error('acceptManagerJobOffer: reject others', rejectErr);
  }

  const { error: statusErr } = await updateManagerJobWorkflowStatus(supabase, {
    jobId,
    managerId: params.managerId,
    companyId: params.companyId,
    status: 'in_progress',
  });

  if (statusErr) {
    const message =
      statusErr instanceof Error
        ? statusErr.message
        : (statusErr as PostgrestError).message || 'Nie udało się zaktualizować statusu zgłoszenia';
    return { success: false, error: message };
  }

  return { success: true };
}

/**
 * Manager selects a tender bid: accept one bid, reject other open ones, mark tender awarded.
 */
export async function acceptManagerTenderOffer(
  supabase: SupabaseClient<Database>,
  params: {
    tenderId: string;
    bidId: string;
    managerId: string;
    companyId: string;
  },
): Promise<AcceptOfferResult> {
  const tenderId = params.tenderId.trim();
  const bidId = params.bidId.trim();

  const ownership = await verifyTenderOwnership(
    supabase,
    tenderId,
    params.managerId,
    params.companyId,
  );
  if (!ownership.ok) {
    return { success: false, error: ownership.error };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid, error: bidErr } = await (supabase as any)
    .from('tender_bids')
    .select('id, tender_id, status')
    .eq('id', bidId)
    .eq('tender_id', tenderId)
    .maybeSingle();

  if (bidErr || !bid) {
    return { success: false, error: 'Nie znaleziono oferty' };
  }

  if (bid.status === 'accepted') {
    return { success: true };
  }

  if (bid.status === 'rejected' || bid.status === 'cancelled') {
    return { success: false, error: 'Tej oferty nie można wybrać' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingAccepted } = await (supabase as any)
    .from('tender_bids')
    .select('id')
    .eq('tender_id', tenderId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (existingAccepted && existingAccepted.id !== bidId) {
    return { success: false, error: 'Ten przetarg ma już wybraną ofertę' };
  }

  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: acceptErr } = await (supabase as any)
    .from('tender_bids')
    .update({
      status: 'accepted',
      evaluated_at: now,
    })
    .eq('id', bidId)
    .eq('tender_id', tenderId);

  if (acceptErr) {
    return {
      success: false,
      error: acceptErr.message || 'Nie udało się zaakceptować oferty',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rejectErr } = await (supabase as any)
    .from('tender_bids')
    .update({
      status: 'rejected',
      evaluated_at: now,
    })
    .eq('tender_id', tenderId)
    .neq('id', bidId)
    .in('status', ['submitted', 'under_review', 'shortlisted']);

  if (rejectErr) {
    console.error('acceptManagerTenderOffer: reject others', rejectErr);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: tenderErr } = await (supabase as any)
    .from('tenders')
    .update({ status: 'awarded', updated_at: now })
    .eq('id', tenderId)
    .eq('manager_id', params.managerId);

  if (tenderErr) {
    return {
      success: false,
      error: tenderErr.message || 'Nie udało się zaktualizować statusu przetargu',
    };
  }

  await createOrderFromContestWinner({
    tenderId,
    bidId,
    managerId: params.managerId,
    companyId: params.companyId,
  });

  return { success: true };
}

/** OPD-63: creates Zamówienie when manager selects contest winner. */
async function createOrderFromContestWinner(_params: {
  tenderId: string;
  bidId: string;
  managerId: string;
  companyId: string;
}): Promise<void> {
  // Stub — full Zamówienia flow tracked in OPD-63.
}

/** Load accepted job application for manager "Wybrana Oferta" tab. */
export async function fetchAcceptedJobApplication(
  supabase: SupabaseClient<Database>,
  jobId: string,
) {
  const { data: apps } = await fetchJobApplicationsByJobId(supabase, jobId);
  return (apps || []).find((a) => a.status === 'accepted') ?? null;
}

/** Load accepted tender bid for manager "Wybrana Oferta" tab. */
export async function fetchAcceptedTenderBid(
  supabase: SupabaseClient<Database>,
  tenderId: string,
) {
  const { data: bids } = await fetchTenderBidsByTenderId(supabase, tenderId);
  const accepted = (bids || []).find(
    (b) => String((b as { status?: string }).status) === 'accepted',
  );
  return accepted ?? null;
}
