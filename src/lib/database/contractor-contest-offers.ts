import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import {
  deriveContractorContestOfferStatus,
  type ContractorContestOfferStatus,
} from '../contest-offer/contractor-contest-offer-status';
import { isContestTender } from '../tender-contest/map-tender-contest-display';
import {
  computeGrossFromNet,
  type ContestOfferDetails,
  type ContestOfferVatRate,
} from '../../types/contest-offer';

export interface ContractorContestOfferRow {
  id: string;
  tenderId: string;
  contestTitle: string;
  organizerName: string;
  netPrice: number;
  grossPrice: number;
  vatRate: ContestOfferVatRate;
  vatLabel: string;
  submissionDeadline: string;
  derivedStatus: ContractorContestOfferStatus;
  bidStatus: string;
  tenderStatus: string;
  submittedAt: string;
}

function parseOfferDetails(raw: unknown): ContestOfferDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as ContestOfferDetails;
}

export function resolveContestBidPricing(
  offerDetails: ContestOfferDetails | null,
  bidAmount: string | number | null | undefined,
): { netPrice: number; grossPrice: number; vatRate: ContestOfferVatRate; vatLabel: string } {
  const vatRate: ContestOfferVatRate =
    offerDetails?.vatRate === '8' || offerDetails?.vatRate === '23' || offerDetails?.vatRate === 'zw'
      ? offerDetails.vatRate
      : '23';

  let netPrice =
    offerDetails?.netPrice != null && !Number.isNaN(offerDetails.netPrice)
      ? offerDetails.netPrice
      : null;

  if (netPrice == null && bidAmount != null) {
    const parsed = typeof bidAmount === 'string' ? Number.parseFloat(bidAmount) : Number(bidAmount);
    if (!Number.isNaN(parsed)) netPrice = parsed;
  }

  if (netPrice == null) netPrice = 0;

  const grossPrice =
    offerDetails?.grossPrice != null && !Number.isNaN(offerDetails.grossPrice)
      ? offerDetails.grossPrice
      : computeGrossFromNet(netPrice, vatRate);

  const vatLabel =
    vatRate === 'zw' ? 'ZW' : vatRate === '8' ? '8% VAT' : '23% VAT';

  return { netPrice, grossPrice, vatRate, vatLabel };
}

interface BidWithContestTender {
  id: string;
  tender_id: string;
  bid_amount?: string | number | null;
  offer_details?: unknown;
  status: string;
  submitted_at: string;
  tenders?: {
    title?: string;
    status?: string;
    submission_deadline?: string;
    building_id?: string | null;
    selection_criteria?: unknown;
    formal_requirements?: unknown;
    companies?: { name?: string } | null;
  } | null;
}

/**
 * OPD-62: Contest-only offers for contractor Moje Oferty (Konkursy tab).
 */
export async function fetchContractorContestOffers(
  supabase: SupabaseClient<Database>,
  contractorUserId: string,
): Promise<ContractorContestOfferRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bids, error } = await (supabase as any)
    .from('tender_bids')
    .select(
      `
      id,
      tender_id,
      bid_amount,
      offer_details,
      status,
      submitted_at,
      tenders (
        title,
        status,
        submission_deadline,
        building_id,
        selection_criteria,
        formal_requirements,
        companies (
          name
        )
      )
    `,
    )
    .eq('contractor_id', contractorUserId)
    .neq('admin_moderation_status', 'suspended')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('fetchContractorContestOffers:', error);
    throw error;
  }

  const rows: ContractorContestOfferRow[] = [];

  for (const bid of (bids || []) as BidWithContestTender[]) {
    const tender = bid.tenders;
    if (!tender) continue;

    const isContest = isContestTender({
      building_id: tender.building_id ?? null,
      selection_criteria: tender.selection_criteria as Record<string, unknown> | null,
      formal_requirements: tender.formal_requirements as Record<string, unknown> | null,
    });

    if (!isContest) continue;

    const submissionDeadline = tender.submission_deadline ?? '';
    const bidStatus = bid.status || 'submitted';
    const tenderStatus = tender.status || 'active';

    const derivedStatus = deriveContractorContestOfferStatus({
      bidStatus,
      tenderStatus,
      submissionDeadlineIso: submissionDeadline,
    });

    const offerDetails = parseOfferDetails(bid.offer_details);
    const pricing = resolveContestBidPricing(offerDetails, bid.bid_amount);

    rows.push({
      id: bid.id,
      tenderId: bid.tender_id,
      contestTitle: tender.title || 'Bez tytułu',
      organizerName: tender.companies?.name || 'Nieznany organizator',
      netPrice: pricing.netPrice,
      grossPrice: pricing.grossPrice,
      vatRate: pricing.vatRate,
      vatLabel: pricing.vatLabel,
      submissionDeadline,
      derivedStatus,
      bidStatus,
      tenderStatus,
      submittedAt: bid.submitted_at,
    });
  }

  return rows;
}
