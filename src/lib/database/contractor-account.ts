import { createClient } from '../supabase/client';

const CONTRACTOR_POLICY_BUCKET = 'verification-documents';

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

export async function upsertContractorAccountSettings(
  userId: string,
  payload: Partial<ContractorAccountSettings>
): Promise<ContractorAccountSettings> {
  const supabase = createClient();
  const dataToSave: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (payload.ocValidUntil !== undefined) {
    dataToSave.oc_valid_until = payload.ocValidUntil;
  }
  if (payload.ocPolicyScanPath !== undefined) {
    dataToSave.oc_policy_scan_path = payload.ocPolicyScanPath;
  }
  if (payload.notificationChannels !== undefined) {
    dataToSave.notification_channels = payload.notificationChannels;
  }
  if (payload.radar !== undefined) {
    dataToSave.radar_settings = payload.radar;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('contractor_account_settings')
    .upsert(dataToSave, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    if (isMissingContractorSettingsTableError(error)) {
      return normalizeSettings(null);
    }
    throw error;
  }

  return normalizeSettings((data as Record<string, unknown>) || null);
}

export async function uploadOcPolicyScan(userId: string, file: File): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient();
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
  const filePath = `${userId}/verification/oc-policy/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(CONTRACTOR_POLICY_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(CONTRACTOR_POLICY_BUCKET).getPublicUrl(filePath);
  return { path: filePath, publicUrl: data.publicUrl };
}

export function getOcPolicyScanPublicUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(CONTRACTOR_POLICY_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

