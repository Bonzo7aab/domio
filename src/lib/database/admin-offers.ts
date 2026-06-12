import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export interface AdminJobApplicationRow {
  id: string;
  jobId: string;
  jobTitle: string | null;
  contractorId: string;
  companyId: string | null;
  companyName: string | null;
  status: string;
  proposedPrice: number | null;
  currency: string | null;
  proposedTimeline: number | null;
  proposedStartDate: string | null;
  coverLetter: string | null;
  experience: string | null;
  teamSize: number | null;
  availableFrom: string | null;
  guaranteePeriod: number | null;
  notes: string | null;
  attachments: unknown;
  certificates: string[] | null;
  adminModerationStatus: string;
  adminFeedbackMessage: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  decisionAt: string | null;
  updatedAt: string | null;
}

export interface AdminTenderBidRow {
  id: string;
  tenderId: string;
  tenderTitle: string | null;
  contractorId: string;
  companyId: string | null;
  companyName: string | null;
  status: string;
  bidAmount: number | null;
  currency: string | null;
  proposedTimeline: number | null;
  proposedStartDate: string | null;
  technicalProposal: string | null;
  financialProposal: string | null;
  teamDescription: string | null;
  experienceSummary: string | null;
  projectReferences: string[] | null;
  certificates: string[] | null;
  attachments: unknown;
  validUntil: string | null;
  evaluationScore: number | null;
  evaluationNotes: string | null;
  adminModerationStatus: string;
  adminFeedbackMessage: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
  updatedAt: string | null;
}

function logSupabaseError(label: string, error: unknown): void {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string; code?: string };
    console.error(label, {
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
    });
  } else {
    console.error(label, error);
  }
}

function pickLatestTimestamp(values: Array<unknown>): string | null {
  const dates = values
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .sort((a, b) => b.localeCompare(a));
  return dates[0] ?? null;
}

export async function fetchAdminJobApplications(
  supabase: SupabaseClient<Database>
): Promise<AdminJobApplicationRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data, error } = await sb
    .from('job_applications')
    .select(
      `
      id,
      job_id,
      contractor_id,
      company_id,
      status,
      proposed_price,
      currency,
      proposed_timeline,
      proposed_start_date,
      cover_letter,
      experience,
      team_size,
      available_from,
      guarantee_period,
      notes,
      attachments,
      certificates,
      admin_moderation_status,
      admin_feedback_message,
      admin_moderated_at,
      submitted_at,
      reviewed_at,
      decision_at,
      jobs ( title ),
      companies ( id, name )
    `
    )
    .order('submitted_at', { ascending: false })
    .limit(200);

  if (error) {
    logSupabaseError('fetchAdminJobApplications', error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => {
    const company = r.companies as { id?: string; name?: string } | null;
    return {
      id: r.id as string,
      jobId: r.job_id as string,
      jobTitle: (r.jobs as { title?: string } | null)?.title ?? null,
      contractorId: r.contractor_id as string,
      companyId: company?.id ?? ((r.company_id as string) ?? null),
      companyName: company?.name ?? null,
      status: r.status as string,
      proposedPrice: (r.proposed_price as number) ?? null,
      currency: (r.currency as string) ?? null,
      proposedTimeline: (r.proposed_timeline as number) ?? null,
      proposedStartDate: (r.proposed_start_date as string) ?? null,
      coverLetter: (r.cover_letter as string) ?? null,
      experience: (r.experience as string) ?? null,
      teamSize: (r.team_size as number) ?? null,
      availableFrom: (r.available_from as string) ?? null,
      guaranteePeriod: (r.guarantee_period as number) ?? null,
      notes: (r.notes as string) ?? null,
      attachments: r.attachments ?? null,
      certificates: (r.certificates as string[]) ?? null,
      adminModerationStatus: (r.admin_moderation_status as string) ?? 'none',
      adminFeedbackMessage: (r.admin_feedback_message as string) ?? null,
      submittedAt: (r.submitted_at as string) ?? null,
      reviewedAt: (r.reviewed_at as string) ?? null,
      decisionAt: (r.decision_at as string) ?? null,
      updatedAt: pickLatestTimestamp([
        r.admin_moderated_at,
        r.decision_at,
        r.reviewed_at,
        r.submitted_at,
      ]),
    };
  });
}

export async function fetchAdminTenderBids(supabase: SupabaseClient<Database>): Promise<AdminTenderBidRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data, error } = await sb
    .from('contest_offers')
    .select(
      `
      id,
      contest_id,
      contractor_id,
      company_id,
      status,
      bid_amount,
      currency,
      proposed_timeline,
      proposed_start_date,
      technical_proposal,
      financial_proposal,
      team_description,
      experience_summary,
      project_references,
      certificates,
      attachments,
      valid_until,
      evaluation_score,
      evaluation_notes,
      admin_moderation_status,
      admin_feedback_message,
      admin_moderated_at,
      submitted_at,
      evaluated_at,
      contests ( title ),
      companies ( id, name )
    `
    )
    .order('submitted_at', { ascending: false })
    .limit(200);

  if (error) {
    logSupabaseError('fetchAdminTenderBids', error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => {
    const company = r.companies as { id?: string; name?: string } | null;
    return {
      id: r.id as string,
      tenderId: r.contest_id as string,
      tenderTitle: (r.contests as { title?: string } | null)?.title ?? null,
      contractorId: r.contractor_id as string,
      companyId: company?.id ?? ((r.company_id as string) ?? null),
      companyName: company?.name ?? null,
      status: r.status as string,
      bidAmount: (r.bid_amount as number) ?? null,
      currency: (r.currency as string) ?? null,
      proposedTimeline: (r.proposed_timeline as number) ?? null,
      proposedStartDate: (r.proposed_start_date as string) ?? null,
      technicalProposal: (r.technical_proposal as string) ?? null,
      financialProposal: (r.financial_proposal as string) ?? null,
      teamDescription: (r.team_description as string) ?? null,
      experienceSummary: (r.experience_summary as string) ?? null,
      projectReferences: (r.project_references as string[]) ?? null,
      certificates: (r.certificates as string[]) ?? null,
      attachments: r.attachments ?? null,
      validUntil: (r.valid_until as string) ?? null,
      evaluationScore: (r.evaluation_score as number) ?? null,
      evaluationNotes: (r.evaluation_notes as string) ?? null,
      adminModerationStatus: (r.admin_moderation_status as string) ?? 'none',
      adminFeedbackMessage: (r.admin_feedback_message as string) ?? null,
      submittedAt: (r.submitted_at as string) ?? null,
      evaluatedAt: (r.evaluated_at as string) ?? null,
      updatedAt: pickLatestTimestamp([
        r.admin_moderated_at,
        r.evaluated_at,
        r.submitted_at,
      ]),
    };
  });
}
