'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/server';
import type { Database, Json } from '../../types/database';

const DEFAULT_CONTRACTOR_NOTIFICATION_CHANNELS = {
  email: true,
  app: true,
  phoneCall: false,
  sms: false,
};

const DEFAULT_CONTRACTOR_RADAR = {
  enabled: true,
  minAmountNet: 1000,
  areas: ['Warszawa'],
};

/**
 * Mirror an `insurance` upload from /verification into the contractor's OC
 * settings, so the /account "Ubezpieczenie OC" card and the verification page
 * see the same file. Best-effort: a sync failure must not abort the main
 * verification submission, but it is logged.
 */
async function syncInsuranceToContractorSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  insurancePath: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  try {
    const { data: existing, error: readErr } = await sb
      .from('contractor_account_settings')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (readErr) {
      console.error('syncInsuranceToContractorSettings: read failed', readErr);
      return;
    }

    if (existing) {
      const { error: updateErr } = await sb
        .from('contractor_account_settings')
        .update({
          oc_policy_scan_path: insurancePath,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      if (updateErr) {
        console.error('syncInsuranceToContractorSettings: update failed', updateErr);
      }
      return;
    }

    const { error: insertErr } = await sb
      .from('contractor_account_settings')
      .insert({
        user_id: userId,
        oc_policy_scan_path: insurancePath,
        notification_channels: DEFAULT_CONTRACTOR_NOTIFICATION_CHANNELS,
        radar_settings: DEFAULT_CONTRACTOR_RADAR,
      });
    if (insertErr) {
      console.error('syncInsuranceToContractorSettings: insert failed', insertErr);
    }
  } catch (err) {
    console.error('syncInsuranceToContractorSettings: unexpected error', err);
  }
}

/**
 * Server-side replacement for the browser-only
 * `getContractorAccountSettings.ocPolicyScanPath`. Used while validating
 * whether the contractor has provided OC through either flow.
 */
async function fetchOcPolicyScanPathServer(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data, error } = await sb
    .from('contractor_account_settings')
    .select('oc_policy_scan_path')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('fetchOcPolicyScanPathServer:', error);
    return null;
  }
  return (data?.oc_policy_scan_path as string | null) ?? null;
}

const BUCKET = 'verification-documents';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

function validateDocFile(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new Error(`Plik jest zbyt duży (max ${MAX_BYTES / (1024 * 1024)} MB)`);
  }
  const rawExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? '' : '';
  const mime = file.type?.toLowerCase() ?? '';
  const mimeOk =
    mime === '' ||
    mime === 'application/pdf' ||
    mime.startsWith('image/jpeg') ||
    mime.startsWith('image/png') ||
    mime.startsWith('image/webp');
  const extOk = ALLOWED_EXT.has(rawExt);
  if (!extOk && !mimeOk) {
    throw new Error('Dozwolone formaty: PDF, JPG, PNG, WEBP');
  }
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function submitVerificationDocumentsAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Musisz być zalogowany.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type, verification_document_paths')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, error: 'Nie udało się wczytać profilu.' };
  }

  const userType = profile.user_type;
  const docKeys =
    userType === 'contractor'
      ? ['company_registration', 'insurance', 'certifications', 'references']
      : ['company_registration', 'insurance', 'management_license', 'management_contracts'];

  const existingPaths =
    (profile.verification_document_paths as Record<string, string> | null | undefined) ?? {};

  const newPaths: Record<string, string> = {};

  for (const key of docKeys) {
    const entry = formData.get(key);
    if (entry instanceof File && entry.size > 0) {
      validateDocFile(entry);
      const ext = entry.name.includes('.') ? entry.name.split('.').pop()?.toLowerCase() ?? 'pdf' : 'pdf';
      const safeExt = ALLOWED_EXT.has(ext) ? ext : 'pdf';
      const path = `${user.id}/verification/${key}/${Date.now()}-${safeFilename(entry.name) || `upload.${safeExt}`}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, entry, { upsert: false });
      if (upErr) {
        return { ok: false, error: upErr.message };
      }
      newPaths[key] = path;
    }
  }

  const merged = { ...existingPaths, ...newPaths };

  let hasInsuranceDoc = Boolean(merged.insurance);
  if (userType === 'contractor' && !hasInsuranceDoc) {
    const ocPath = await fetchOcPolicyScanPathServer(supabase, user.id);
    if (ocPath) {
      // Pull the OC scan from account settings into the verification doc set
      // so admins see one unified list and the rest of the flow uses one
      // canonical path.
      merged.insurance = ocPath;
      hasInsuranceDoc = true;
    }
  }

  const hasCompanyReg = Boolean(merged.company_registration);

  if (!hasCompanyReg) {
    return { ok: false, error: 'Wymagany dokument: wypis z KRS / CEIDG.' };
  }
  if (!hasInsuranceDoc) {
    return {
      ok: false,
      error:
        userType === 'contractor'
          ? 'Wymagana polisa OC: prześlij plik lub uzupełnij skan OC w ustawieniach konta wykonawcy.'
          : 'Wymagany dokument ubezpieczenia OC.',
    };
  }

  const { error: updateErr } = await supabase
    .from('user_profiles')
    .update({
      verification_document_paths: merged as Json,
      verification_submitted_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  // Mirror any newly uploaded insurance file into the contractor's OC
  // settings so /account?tab=contractor-data reflects the same state.
  if (userType === 'contractor' && newPaths.insurance) {
    await syncInsuranceToContractorSettings(supabase, user.id, newPaths.insurance);
  }

  revalidatePath('/account');
  return { ok: true };
}
