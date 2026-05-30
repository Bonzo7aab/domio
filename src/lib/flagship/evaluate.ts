import 'server-only';

import type { EvaluationContext } from '@openfeature/server-sdk';
import { isFlagshipConfigured } from './config';
import type { FlagshipFlagKey, TestingFeatureFlags } from './keys';
import { TESTING_FEATURE_FLAG_KEYS } from './keys';
import { getOpenFeatureClient } from './provider';

export async function getBooleanFlag(
  flagKey: FlagshipFlagKey,
  defaultValue: boolean,
  context?: EvaluationContext,
): Promise<boolean> {
  if (!isFlagshipConfigured()) {
    return defaultValue;
  }

  try {
    const client = await getOpenFeatureClient();
    return await client.getBooleanValue(flagKey, defaultValue, context);
  } catch (error) {
    console.error(`[flagship] Failed to evaluate "${flagKey}":`, error);
    return defaultValue;
  }
}

export async function isFeatureEnabled(
  flagKey: FlagshipFlagKey,
  context?: EvaluationContext,
): Promise<boolean> {
  return getBooleanFlag(flagKey, false, context);
}

export async function getTestingFeatureFlags(
  context?: EvaluationContext,
): Promise<TestingFeatureFlags> {
  const entries = await Promise.all(
    TESTING_FEATURE_FLAG_KEYS.map(async (key) => {
      const value = await getBooleanFlag(key, false, context);
      return [key, value] as const;
    }),
  );

  return Object.fromEntries(entries) as TestingFeatureFlags;
}
