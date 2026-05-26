import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { ContestInfo } from '../../types/job';
import type {
  ContestOfferDetails,
  ContestOfferFormData,
  FormalRequirementKey,
} from '../../types/contest-offer';
import {
  computeGrossFromNet,
  formDataToOfferDetails,
  mergeAttachmentsForBid,
  offerDetailsToFormData,
  requiredFormalKeys,
} from '../../types/contest-offer';
import type { SiteVisitType } from '../../types/tender-contest';
import { uploadBidAttachment } from '../storage/bid-attachments';

export type TenderBidOfferState = 'none' | 'draft' | 'submitted';

export interface TenderBidRowLite {
  id: string;
  status: string;
  offer_details?: ContestOfferDetails | null;
  bid_amount?: number;
  experience_summary?: string | null;
  attachments?: unknown;
  proposed_start_date?: string | null;
  proposed_timeline?: number | null;
}

async function ensureContractorCanBid(
  supabase: SupabaseClient<Database>,
  contractorId: string,
): Promise<{ companyId: string } | { error: PostgrestError }> {
  const { canUserUsePlatformFeatures } = await import('../verification/can-use-platform');
  const access = await canUserUsePlatformFeatures(supabase, contractorId);
  if (!access.allowed) {
    return {
      error: new Error(
        access.message ?? 'Konto wykonawcy nie jest zweryfikowane.',
      ) as PostgrestError,
    };
  }

  const { fetchUserPrimaryCompany } = await import('./companies');
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(
    supabase,
    contractorId,
  );

  if (companyError || !company) {
    return {
      error: new Error(
        companyError instanceof Error
          ? companyError.message
          : 'Contractor must have a company to submit bids',
      ) as PostgrestError,
    };
  }

  return { companyId: company.id };
}

function daysUntilCompletion(completionDateIso: string): number | null {
  const completion = new Date(completionDateIso);
  if (Number.isNaN(completion.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  completion.setHours(0, 0, 0, 0);
  const diff = completion.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function uploadStagedFiles(
  supabase: SupabaseClient<Database>,
  userId: string,
  tenderId: string,
  form: ContestOfferFormData,
): Promise<{ form: ContestOfferFormData; error: string | null }> {
  const next = { ...form, formalAttachments: { ...form.formalAttachments } };
  const staged = form.stagedFiles;

  for (const [key, files] of Object.entries(staged)) {
    if (!files?.length) continue;
    const file = files[0];
    const { data, error } = await uploadBidAttachment(supabase, file, userId, tenderId);
    if (error || !data) {
      return { form: next, error: error?.message ?? 'Nie udało się wgrać pliku' };
    }

    if (key === 'deposit' || key === 'other') {
      next.extraAttachments = [
        ...next.extraAttachments,
        {
          id: `${Date.now()}-${key}`,
          name: file.name,
          path: data.path,
          url: data.url,
          type: data.type === 'image' ? ('image' as const) : ('document' as const),
          source: 'override' as const,
          requirementKey: key,
          size: file.size,
        },
      ];
    } else {
      const formalKey = key as FormalRequirementKey;
      next.formalAttachments[formalKey] = {
        id: `${Date.now()}-${key}`,
        name: file.name,
        path: data.path,
        url: data.url,
        type: data.type === 'image' ? ('image' as const) : ('document' as const),
        source: 'override' as const,
        requirementKey: formalKey,
        size: file.size,
      };
    }
  }

  next.stagedFiles = {};
  return { form: next, error: null };
}

function buildRowFromForm(
  form: ContestOfferFormData,
  step?: number,
  status: 'draft' | 'submitted' = 'draft',
): Record<string, unknown> {
  const details = formDataToOfferDetails(form, step);
  const net = details.netPrice ?? 0;
  const attachments = mergeAttachmentsForBid(form);
  const timeline = form.proposedCompletionDate
    ? daysUntilCompletion(form.proposedCompletionDate)
    : null;

  return {
    bid_amount: net > 0 ? net : 0,
    currency: 'PLN',
    proposed_start_date: form.proposedCompletionDate || null,
    proposed_timeline: timeline,
    experience_summary: form.referencesText.trim() || null,
    attachments: attachments.length > 0 ? attachments : null,
    offer_details: details,
    status,
    ...(status === 'submitted' ? { submitted_at: new Date().toISOString() } : {}),
  };
}

export function validateContestOfferSubmit(
  form: ContestOfferFormData,
  contestInfo: ContestInfo,
): string | null {
  if (!form.proposedCompletionDate) {
    return 'Podaj oferowany termin wykonania';
  }

  if (contestInfo.siteVisitType === 'mandatory' && !form.siteVisitConfirmed) {
    return 'Potwierdź odbycie wizji lokalnej';
  }

  const net = Number.parseFloat(form.netPrice);
  if (!form.netPrice.trim() || Number.isNaN(net) || net <= 0) {
    return 'Podaj cenę netto';
  }

  if (!form.warrantyMonths) return 'Wybierz okres gwarancji';
  if (!form.guaranteeMonths) return 'Wybierz okres rękojmi';

  if (
    contestInfo.paymentTerms.mode === 'custom' &&
    (contestInfo.paymentTerms.customDays ?? 0) > 14 &&
    !form.paymentTermsAccepted
  ) {
    return 'Zaakceptuj wymagany termin płatności';
  }

  if (contestInfo.depositRequired) {
    const depositFile = form.extraAttachments.find((a) => a.requirementKey === 'deposit');
    const stagedDeposit = form.stagedFiles.deposit?.length;
    if (!depositFile && !stagedDeposit) {
      return 'Wgraj potwierdzenie przelewu wadium';
    }
  }

  const required = requiredFormalKeys(contestInfo.formalRequirements);
  for (const key of required) {
    if (key === 'references') {
      if (!form.referencesText.trim()) {
        return 'Uzupełnij wykaz zrealizowanych prac';
      }
      continue;
    }
    const attached = form.formalAttachments[key];
    const staged = form.stagedFiles[key]?.length;
    if (!attached && !staged) {
      const labels: Record<FormalRequirementKey, string> = {
        insuranceOc: 'polisa OC',
        zusUsCertificates: 'zaświadczenia ZUS/US',
        references: 'referencje',
        professionalCertificates: 'certyfikaty zawodowe',
        professionalLicenses: 'uprawnienia zawodowe',
      };
      return `Brakuje wymaganego dokumentu: ${labels[key]}`;
    }
  }

  return null;
}

export async function fetchTenderBidOfferState(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  contractorId: string,
): Promise<{ state: TenderBidOfferState; bid: TenderBidRowLite | null }> {
  const access = await ensureContractorCanBid(supabase, contractorId);
  if ('error' in access) {
    return { state: 'none', bid: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase as any)
    .from('tender_bids')
    .select('id, status, offer_details, bid_amount, experience_summary, attachments, proposed_start_date, proposed_timeline')
    .eq('tender_id', tenderId)
    .eq('company_id', access.companyId)
    .neq('status', 'cancelled');

  const bids = (rows ?? []) as TenderBidRowLite[];
  const submitted = bids.find((b) => b.status !== 'draft');
  if (submitted) {
    return { state: 'submitted', bid: submitted };
  }
  const draft = bids.find((b) => b.status === 'draft');
  if (draft) {
    return { state: 'draft', bid: draft };
  }
  return { state: 'none', bid: null };
}

export async function fetchTenderBidDraft(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  contractorId: string,
): Promise<{ data: TenderBidRowLite | null; error: PostgrestError | null }> {
  const { state, bid } = await fetchTenderBidOfferState(supabase, tenderId, contractorId);
  if (state === 'draft' && bid) {
    return { data: bid, error: null };
  }
  return { data: null, error: null };
}

export async function upsertTenderBidDraft(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  contractorId: string,
  form: ContestOfferFormData,
  currentStep: number,
): Promise<{ data: TenderBidRowLite | null; error: PostgrestError | null }> {
  try {
    const access = await ensureContractorCanBid(supabase, contractorId);
    if ('error' in access) {
      return { data: null, error: access.error };
    }

    const { state } = await fetchTenderBidOfferState(supabase, tenderId, contractorId);
    if (state === 'submitted') {
      return {
        data: null,
        error: new Error('Oferta została już złożona.') as PostgrestError,
      };
    }

    const { form: uploadedForm, error: uploadError } = await uploadStagedFiles(
      supabase,
      contractorId,
      tenderId,
      form,
    );
    if (uploadError) {
      return { data: null, error: new Error(uploadError) as PostgrestError };
    }

    const row = buildRowFromForm(uploadedForm, currentStep, 'draft');

    if (state === 'draft') {
      const { bid } = await fetchTenderBidOfferState(supabase, tenderId, contractorId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('tender_bids')
        .update(row)
        .eq('id', bid?.id)
        .select()
        .single();
      if (error) {
        return { data: null, error: error as PostgrestError };
      }
      return { data: data as TenderBidRowLite, error: null };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tender_bids')
      .insert({
        tender_id: tenderId,
        contractor_id: contractorId,
        company_id: access.companyId,
        ...row,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error as PostgrestError };
    }
    return { data: data as TenderBidRowLite, error: null };
  } catch (err) {
    return {
      data: null,
      error: (err instanceof Error ? err : new Error(String(err))) as PostgrestError,
    };
  }
}

export async function submitTenderBid(
  supabase: SupabaseClient<Database>,
  tenderId: string,
  contractorId: string,
  form: ContestOfferFormData,
  contestInfo: ContestInfo,
): Promise<{ data: TenderBidRowLite | null; error: PostgrestError | null }> {
  const validationError = validateContestOfferSubmit(form, contestInfo);
  if (validationError) {
    return { data: null, error: new Error(validationError) as PostgrestError };
  }

  const { form: uploadedForm, error: uploadError } = await uploadStagedFiles(
    supabase,
    contractorId,
    tenderId,
    form,
  );
  if (uploadError) {
    return { data: null, error: new Error(uploadError) as PostgrestError };
  }

  const row = buildRowFromForm(uploadedForm, 4, 'submitted');
  const details = row.offer_details as ContestOfferDetails;
  if (details.netPrice != null && details.vatRate) {
    details.grossPrice = computeGrossFromNet(details.netPrice, details.vatRate);
    row.offer_details = details;
    row.financial_proposal = JSON.stringify({
      netPrice: details.netPrice,
      vatRate: details.vatRate,
      grossPrice: details.grossPrice,
      warrantyMonths: details.warrantyMonths,
      guaranteeMonths: details.guaranteeMonths,
    });
  }

  try {
    const access = await ensureContractorCanBid(supabase, contractorId);
    if ('error' in access) {
      return { data: null, error: access.error };
    }

    const { state, bid } = await fetchTenderBidOfferState(supabase, tenderId, contractorId);
    if (state === 'submitted') {
      return {
        data: null,
        error: new Error(
          'Już złożyłeś ofertę na ten konkurs. Nie możesz złożyć więcej niż jednej oferty.',
        ) as PostgrestError,
      };
    }

    if (state === 'draft' && bid?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('tender_bids')
        .update(row)
        .eq('id', bid.id)
        .select()
        .single();
      if (error) return { data: null, error: error as PostgrestError };
      return { data: data as TenderBidRowLite, error: null };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tender_bids')
      .insert({
        tender_id: tenderId,
        contractor_id: contractorId,
        company_id: access.companyId,
        ...row,
      })
      .select()
      .single();

    if (error) return { data: null, error: error as PostgrestError };
    return { data: data as TenderBidRowLite, error: null };
  } catch (err) {
    return {
      data: null,
      error: (err instanceof Error ? err : new Error(String(err))) as PostgrestError,
    };
  }
}

export function hydrateContestOfferFormFromBid(bid: TenderBidRowLite | null): ContestOfferFormData {
  if (!bid?.offer_details) {
    return offerDetailsToFormData(null);
  }
  const form = offerDetailsToFormData(bid.offer_details as ContestOfferDetails);
  if (bid.experience_summary && !form.referencesText) {
    form.referencesText = bid.experience_summary;
  }
  if (bid.attachments && Array.isArray(bid.attachments)) {
    for (const att of bid.attachments as Array<{
      requirementKey?: string;
      source?: string;
      name: string;
      path: string;
      url?: string;
      type: string;
      id: string;
      size?: number;
    }>) {
      if (att.requirementKey && att.requirementKey !== 'deposit' && att.requirementKey !== 'other') {
        form.formalAttachments[att.requirementKey as FormalRequirementKey] = {
          id: att.id,
          name: att.name,
          path: att.path,
          url: att.url,
          type: att.type === 'image' ? 'image' : 'document',
          source: att.source === 'profile' ? 'profile' : 'override',
          requirementKey: att.requirementKey as FormalRequirementKey,
          size: att.size,
        };
      } else {
        form.extraAttachments.push({
          id: att.id,
          name: att.name,
          path: att.path,
          url: att.url,
          type: att.type === 'image' ? 'image' : 'document',
          source: 'extra',
          requirementKey: att.requirementKey as 'deposit' | 'other' | undefined,
          size: att.size,
        });
      }
    }
  }
  return form;
}

export function contestCountdownLabel(deadlineIso: string): string {
  const end = new Date(deadlineIso);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Termin składania ofert minął';
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `Pozostało ${days} dni, ${hours} godzin`;
}

export function completionDateWarning(
  offeredDate: string,
  managerCompletionDate: string | null,
): string | null {
  if (!managerCompletionDate || !offeredDate) return null;
  const offered = new Date(offeredDate);
  const preferred = new Date(managerCompletionDate);
  if (Number.isNaN(offered.getTime()) || Number.isNaN(preferred.getTime())) return null;
  if (offered > preferred) {
    return 'Twój termin wykonania jest późniejszy niż preferowany przez zarządcę.';
  }
  return null;
}

export type { SiteVisitType };
