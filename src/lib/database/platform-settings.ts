import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import {
  DEFAULT_REGISTRATION_SETTINGS,
  type RegistrationSettings,
} from '../registration-settings-shared';

export type { RegistrationSettings } from '../registration-settings-shared';
export { registrationClosedMessage } from '../registration-settings-shared';

interface PlatformSettingsRow {
  contractor_registration_enabled: boolean;
  manager_registration_enabled: boolean;
}

async function fetchSettingsRow(
  client: SupabaseClient<Database>
): Promise<PlatformSettingsRow | null> {
  const { data, error } = await client
    .from('platform_settings')
    .select('contractor_registration_enabled, manager_registration_enabled')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PlatformSettingsRow;
}

export async function getRegistrationSettings(
  client?: SupabaseClient<Database>
): Promise<RegistrationSettings> {
  const supabase = client ?? (await createClient());
  const row = await fetchSettingsRow(supabase);

  if (!row) {
    return DEFAULT_REGISTRATION_SETTINGS;
  }

  return {
    contractorOpen: row.contractor_registration_enabled !== false,
    managerOpen: row.manager_registration_enabled !== false,
  };
}

/** Server-side read for register action (works before auth). */
export async function getRegistrationSettingsForRegister(): Promise<RegistrationSettings> {
  try {
    const admin = createAdminClient();
    const row = await fetchSettingsRow(admin);
    if (!row) {
      return DEFAULT_REGISTRATION_SETTINGS;
    }
    return {
      contractorOpen: row.contractor_registration_enabled !== false,
      managerOpen: row.manager_registration_enabled !== false,
    };
  } catch {
    return DEFAULT_REGISTRATION_SETTINGS;
  }
}

export async function updateRegistrationSettings(
  contractorOpen: boolean,
  managerOpen: boolean,
  actorId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error: updateErr } = await admin
    .from('platform_settings')
    .update({
      contractor_registration_enabled: contractorOpen,
      manager_registration_enabled: managerOpen,
      updated_at: new Date().toISOString(),
      updated_by: actorId,
    })
    .eq('id', 1);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin_action_logs not in generated types
  await (admin as any).from('admin_action_logs').insert({
    actor_id: actorId,
    action_type: 'platform_settings_update',
    entity_table: 'platform_settings',
    entity_id: null,
    payload: {
      contractor_registration_enabled: contractorOpen,
      manager_registration_enabled: managerOpen,
    },
  });

  return { ok: true };
}
