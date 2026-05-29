'use server';

import { createClient } from '../supabase/server';
import type { ContestInfo } from '../../types/job';
import type { ContestOfferFormData } from '../../types/contest-offer';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  submitTenderBid as submitTenderBidWithClient,
  upsertTenderBidDraft as upsertTenderBidDraftWithClient,
  type ContestOfferWizardStep,
  type TenderBidRowLite,
} from './contest-offers';

export async function submitTenderBid(
  tenderId: string,
  contractorId: string,
  form: ContestOfferFormData,
  contestInfo: ContestInfo,
): Promise<{ data: TenderBidRowLite | null; error: PostgrestError | null }> {
  const supabase = await createClient();
  return submitTenderBidWithClient(supabase, tenderId, contractorId, form, contestInfo);
}

export async function upsertTenderBidDraft(
  tenderId: string,
  contractorId: string,
  form: ContestOfferFormData,
  currentStep: ContestOfferWizardStep,
): Promise<{ data: TenderBidRowLite | null; error: PostgrestError | null }> {
  const supabase = await createClient();
  return upsertTenderBidDraftWithClient(supabase, tenderId, contractorId, form, currentStep);
}
