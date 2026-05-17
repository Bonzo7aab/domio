'use server';

import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { updateManagerJobWorkflowStatus } from '../../../lib/database/jobs';
import { JOB_WORKFLOW_STATUSES } from '../../../lib/job-workflow-status';
import { revalidatePath } from 'next/cache';

const ALLOWED = new Set<string>([...JOB_WORKFLOW_STATUSES, 'draft']);

export async function updateJobWorkflowStatusAction(
  jobId: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  if (!jobId?.trim() || !ALLOWED.has(status)) {
    return { success: false, error: 'Nieprawidłowe dane' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Wymagane logowanie' };
  }

  const { data: company, error: companyError } = await fetchUserPrimaryCompany(
    supabase,
    user.id,
  );

  if (companyError || !company) {
    return { success: false, error: 'Brak firmy zarządcy' };
  }

  const { error } = await updateManagerJobWorkflowStatus(supabase, {
    jobId: jobId.trim(),
    managerId: user.id,
    companyId: company.id,
    status,
  });

  if (error) {
    const message =
      error instanceof Error
        ? error.message
        : (error as { message?: string }).message || 'Nie udało się zapisać statusu';
    return { success: false, error: message };
  }

  revalidatePath('/manager-dashboard/zgloszenia');
  revalidatePath(`/jobs/${jobId.trim()}`);

  return { success: true };
}
