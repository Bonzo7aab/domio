'use server';

import { createClient } from '../supabase/server';
import { buildEvaluationContext } from './context';
import { getTestingFeatureFlags } from './evaluate';
import type { TestingFeatureFlags } from './keys';
import { TESTING_FEATURE_FLAG_KEYS } from './keys';
import { isFlagshipConfigured } from './config';

function defaultTestingFlags(): TestingFeatureFlags {
  return Object.fromEntries(
    TESTING_FEATURE_FLAG_KEYS.map((key) => [key, false]),
  ) as TestingFeatureFlags;
}

export interface TestingFeatureFlagsResult {
  flags: TestingFeatureFlags;
  evaluatedAt: string;
  configured: boolean;
  error?: string;
}

async function assertCanReadTestingFlags(): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.platform_role !== 'platform_admin') {
    throw new Error('Forbidden');
  }
}

export async function getTestingFeatureFlagsAction(): Promise<TestingFeatureFlagsResult> {
  await assertCanReadTestingFlags();

  const evaluatedAt = new Date().toISOString();
  const configured = isFlagshipConfigured();

  if (!configured) {
    return {
      flags: defaultTestingFlags(),
      evaluatedAt,
      configured: false,
      error:
        'Flagship is not configured. Set FLAGSHIP_APP_ID, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_FLAGSHIP_API_TOKEN.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let evaluationContext = buildEvaluationContext(null);

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, platform_role')
      .eq('id', user.id)
      .maybeSingle();

    evaluationContext = buildEvaluationContext({
      id: user.id,
      email: user.email,
      userType: profile?.user_type,
      platformRole: profile?.platform_role ?? undefined,
    });
  }

  try {
    const flags = await getTestingFeatureFlags(evaluationContext);
    return { flags, evaluatedAt, configured: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Flag evaluation failed';

    return {
      flags: defaultTestingFlags(),
      evaluatedAt,
      configured: true,
      error: message,
    };
  }
}
