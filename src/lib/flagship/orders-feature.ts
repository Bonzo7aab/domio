import 'server-only';

import type { EvaluationContext } from '@openfeature/server-sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { buildEvaluationContext } from './context';
import { isFeatureEnabled } from './evaluate';
import { FLAGSHIP_FLAG_KEYS } from './keys';

interface OrdersFeatureProfile {
  user_type?: string | null;
  platform_role?: string | null;
}

export const ORDERS_FEATURE_DISABLED_ERROR = 'Funkcja niedostępna';

export async function isOrdersFeatureEnabled(
  context?: EvaluationContext,
): Promise<boolean> {
  return isFeatureEnabled(FLAGSHIP_FLAG_KEYS.ORDERS, context);
}

export async function isOrdersFeatureEnabledForUser(
  user: User,
  profile?: OrdersFeatureProfile | null,
): Promise<boolean> {
  return isOrdersFeatureEnabled(
    buildEvaluationContext({
      id: user.id,
      email: user.email,
      userType: profile?.user_type ?? undefined,
      platformRole: profile?.platform_role ?? undefined,
    }),
  );
}

export async function isOrdersFeatureEnabledForAuthUser(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, platform_role')
    .eq('id', user.id)
    .maybeSingle();

  return isOrdersFeatureEnabledForUser(user, profile);
}
