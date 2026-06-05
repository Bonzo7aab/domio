import 'server-only';

import { OpenFeature } from '@openfeature/server-sdk';
import { FlagshipServerProvider } from '@cloudflare/flagship/server';
import { getFlagshipConfig, isFlagshipConfigured } from './config';

let initPromise: Promise<void> | null = null;

export async function initFlagshipProvider(): Promise<void> {
  if (!isFlagshipConfigured()) {
    return;
  }

  if (!initPromise) {
    const { appId, accountId, authToken } = getFlagshipConfig();
    const provider = new FlagshipServerProvider({
      appId,
      accountId,
      authToken,
      // App handles evaluation errors in evaluate.ts; avoid noisy SDK logs for missing flags.
      logging: false,
    });
    initPromise = OpenFeature.setProviderAndWait(provider).then(() => {
      if (provider.status !== 'READY' && process.env.NODE_ENV === 'development') {
        console.warn(
          '[flagship] Provider status is',
          provider.status,
          '— check CLOUDFLARE_FLAGSHIP_API_TOKEN (Flagship Evaluate permission). Run: npm run flagship:check',
        );
      }
    });
  }

  await initPromise;
}

export async function getOpenFeatureClient() {
  await initFlagshipProvider();
  return OpenFeature.getClient();
}
