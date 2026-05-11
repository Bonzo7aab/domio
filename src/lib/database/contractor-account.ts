import { createClient } from '../supabase/client';

const CONTRACTOR_POLICY_BUCKET = 'verification-documents';

/** Rozszerzenia i MIME dla skanu polisy OC (spójne z UI i walidacją uploadu). */
export const OC_POLICY_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const;

const OC_POLICY_ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const OC_POLICY_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const OC_POLICY_SIGNED_URL_TTL_SEC = 3600;

export function getOcPolicyAllowedFormatsLabel(): string {
  return 'PDF, JPG, JPEG, PNG, WEBP';
}

export interface ContractorNotificationChannels {
  email: boolean;
  app: boolean;
  phoneCall: boolean;
  sms: boolean;
}

export interface ContractorRadarSettings {
  enabled: boolean;
  minAmountNet: number;
  areas: string[];
}

export interface ContractorAccountSettings {
  ocValidUntil: string | null;
  ocPolicyScanPath: string | null;
  notificationChannels: ContractorNotificationChannels;
  radar: ContractorRadarSettings;
  updatedAt: string | null;
}

const DEFAULT_CHANNELS: ContractorNotificationChannels = {
  email: true,
  app: true,
  phoneCall: false,
  sms: false,
};

const DEFAULT_RADAR: ContractorRadarSettings = {
  enabled: true,
  minAmountNet: 1000,
  areas: ['Warszawa'],
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const normalizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const normalizeAreas = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return DEFAULT_RADAR.areas;
  }

  const filtered = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return filtered.length > 0 ? filtered : DEFAULT_RADAR.areas;
};

const normalizeSettings = (row: Record<string, unknown> | null): ContractorAccountSettings => {
  if (!row) {
    return {
      ocValidUntil: null,
      ocPolicyScanPath: null,
      notificationChannels: DEFAULT_CHANNELS,
      radar: DEFAULT_RADAR,
      updatedAt: null,
    };
  }

  const notificationChannelsRaw =
    typeof row.notification_channels === 'object' && row.notification_channels !== null
      ? (row.notification_channels as Record<string, unknown>)
      : {};

  const radarRaw =
    typeof row.radar_settings === 'object' && row.radar_settings !== null
      ? (row.radar_settings as Record<string, unknown>)
      : {};

  return {
    ocValidUntil: typeof row.oc_valid_until === 'string' ? row.oc_valid_until : null,
    ocPolicyScanPath: typeof row.oc_policy_scan_path === 'string' ? row.oc_policy_scan_path : null,
    notificationChannels: {
      email: normalizeBoolean(notificationChannelsRaw.email, DEFAULT_CHANNELS.email),
      app: normalizeBoolean(notificationChannelsRaw.app, DEFAULT_CHANNELS.app),
      phoneCall: normalizeBoolean(notificationChannelsRaw.phoneCall, DEFAULT_CHANNELS.phoneCall),
      sms: normalizeBoolean(notificationChannelsRaw.sms, DEFAULT_CHANNELS.sms),
    },
    radar: {
      enabled: normalizeBoolean(radarRaw.enabled, DEFAULT_RADAR.enabled),
      minAmountNet: normalizeNumber(radarRaw.minAmountNet, DEFAULT_RADAR.minAmountNet),
      areas: normalizeAreas(radarRaw.areas),
    },
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
};

const isMissingContractorSettingsTableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string; details?: string };
  if (maybeError.code === '42P01' || maybeError.code === 'PGRST205') {
    return true;
  }

  const combined = `${maybeError.message || ''} ${maybeError.details || ''}`.toLowerCase();
  return (
    combined.includes('contractor_account_settings') &&
    (combined.includes('does not exist') || combined.includes('not found') || combined.includes('could not find'))
  );
};

export async function getContractorAccountSettings(userId: string): Promise<ContractorAccountSettings> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('contractor_account_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingContractorSettingsTableError(error)) {
      return normalizeSettings(null);
    }
    throw error;
  }

  return normalizeSettings((data as Record<string, unknown> | null) || null);
}

/**
 * Mirror the OC scan path into the user's verification document set so the
 * `/verification` page (and admin review) sees the same file as the OC card.
 * Best-effort: any failure is logged but does not roll back the main upsert.
 */
async function syncOcScanToVerificationDocs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  userId: string,
  ocPath: string | null
): Promise<void> {
  try {
    const { data: profile, error: readError } = await client
      .from('user_profiles')
      .select('verification_document_paths')
      .eq('id', userId)
      .maybeSingle();

    if (readError) {
      console.error('syncOcScanToVerificationDocs: read failed', readError);
      return;
    }

    const paths =
      (profile?.verification_document_paths as Record<string, string> | null | undefined) ?? {};
    const next: Record<string, string> = { ...paths };
    if (ocPath) {
      if (next.insurance === ocPath) return; // no-op
      next.insurance = ocPath;
    } else {
      if (!('insurance' in next)) return; // no-op
      delete next.insurance;
    }

    const { error: writeError } = await client
      .from('user_profiles')
      .update({ verification_document_paths: next })
      .eq('id', userId);

    if (writeError) {
      console.error('syncOcScanToVerificationDocs: write failed', writeError);
    }
  } catch (err) {
    console.error('syncOcScanToVerificationDocs: unexpected error', err);
  }
}

export async function upsertContractorAccountSettings(
  userId: string,
  payload: Partial<ContractorAccountSettings>
): Promise<ContractorAccountSettings> {
  const supabase = createClient();
  const updatedAt = new Date().toISOString();

  const patch: Record<string, unknown> = { updated_at: updatedAt };

  if (payload.ocValidUntil !== undefined) {
    patch.oc_valid_until = payload.ocValidUntil;
  }
  if (payload.ocPolicyScanPath !== undefined) {
    patch.oc_policy_scan_path = payload.ocPolicyScanPath;
  }
  if (payload.notificationChannels !== undefined) {
    patch.notification_channels = payload.notificationChannels;
  }
  if (payload.radar !== undefined) {
    patch.radar_settings = payload.radar;
  }

  // Explicit UPDATE / INSERT — partial `.upsert()` can omit columns or behave unexpectedly with RLS + defaults.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data: existingRow, error: selectError } = await client
    .from('contractor_account_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    if (isMissingContractorSettingsTableError(selectError)) {
      return normalizeSettings(null);
    }
    throw selectError;
  }

  if (existingRow) {
    const { data, error } = await client
      .from('contractor_account_settings')
      .update(patch)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      if (isMissingContractorSettingsTableError(error)) {
        return normalizeSettings(null);
      }
      throw error;
    }

    if (payload.ocPolicyScanPath !== undefined) {
      await syncOcScanToVerificationDocs(client, userId, payload.ocPolicyScanPath);
    }

    return normalizeSettings((data as Record<string, unknown>) || null);
  }

  const insertRow: Record<string, unknown> = {
    user_id: userId,
    notification_channels: DEFAULT_CHANNELS,
    radar_settings: DEFAULT_RADAR,
    ...patch,
  };

  const { data, error } = await client.from('contractor_account_settings').insert(insertRow).select('*').single();

  if (error) {
    if (isMissingContractorSettingsTableError(error)) {
      return normalizeSettings(null);
    }
    // Race: another request inserted the row between select and insert
    const maybeUnique = (error as { code?: string }).code === '23505';
    if (maybeUnique) {
      const { data: afterRace, error: retryError } = await client
        .from('contractor_account_settings')
        .update(patch)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (retryError) {
        throw retryError;
      }
      if (payload.ocPolicyScanPath !== undefined) {
        await syncOcScanToVerificationDocs(client, userId, payload.ocPolicyScanPath);
      }
      return normalizeSettings((afterRace as Record<string, unknown>) || null);
    }
    throw error;
  }

  if (payload.ocPolicyScanPath !== undefined) {
    await syncOcScanToVerificationDocs(client, userId, payload.ocPolicyScanPath);
  }

  return normalizeSettings((data as Record<string, unknown>) || null);
}

function validateOcPolicyFile(file: File): void {
  if (file.size > OC_POLICY_MAX_BYTES) {
    throw new Error(`Plik jest zbyt duży. Maksymalny rozmiar: ${OC_POLICY_MAX_BYTES / (1024 * 1024)} MB`);
  }

  const rawExt = file.name.includes('.') ? file.name.split('.').pop() : '';
  const extension = rawExt ? rawExt.toLowerCase() : '';
  const mime = file.type?.toLowerCase() ?? '';

  const extOk = OC_POLICY_ALLOWED_EXTENSIONS.includes(
    extension as (typeof OC_POLICY_ALLOWED_EXTENSIONS)[number]
  );
  const mimeOk =
    mime === '' ||
    OC_POLICY_ALLOWED_MIME.has(mime) ||
    mime === 'image/pjpeg';

  if (!extOk && !mimeOk) {
    throw new Error(
      `Nieobsługiwany format pliku. Dozwolone: ${getOcPolicyAllowedFormatsLabel()} (max ${OC_POLICY_MAX_BYTES / (1024 * 1024)} MB)`
    );
  }
}

export async function uploadOcPolicyScan(userId: string, file: File): Promise<{ path: string }> {
  validateOcPolicyFile(file);

  const supabase = createClient();
  const rawExt = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
  const extension = rawExt ? rawExt.toLowerCase() : 'pdf';
  const safeExt = OC_POLICY_ALLOWED_EXTENSIONS.includes(
    extension as (typeof OC_POLICY_ALLOWED_EXTENSIONS)[number]
  )
    ? extension
    : 'pdf';

  const filePath = `${userId}/verification/oc-policy/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(CONTRACTOR_POLICY_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  return { path: filePath };
}

/**
 * Podpisany URL — bucket jest zwykle prywatny; `getPublicUrl` nie działa w przeglądarce bez polityki public read.
 */
export async function getOcPolicyScanSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(CONTRACTOR_POLICY_BUCKET)
    .createSignedUrl(path, OC_POLICY_SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) {
    console.error('getOcPolicyScanSignedUrl:', error);
    return null;
  }

  return data.signedUrl;
}

