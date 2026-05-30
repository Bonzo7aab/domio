import 'server-only';

export interface FlagshipConfig {
  appId: string;
  accountId: string;
  authToken: string;
}

function getTrimmedEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isFlagshipConfigured(): boolean {
  return Boolean(
    getTrimmedEnv('FLAGSHIP_APP_ID') &&
      getTrimmedEnv('CLOUDFLARE_ACCOUNT_ID') &&
      getTrimmedEnv('CLOUDFLARE_FLAGSHIP_API_TOKEN'),
  );
}

/**
 * Returns Flagship credentials or throws with a clear message (dev / misconfiguration).
 */
export function getFlagshipConfig(): FlagshipConfig {
  const appId = getTrimmedEnv('FLAGSHIP_APP_ID');
  const accountId = getTrimmedEnv('CLOUDFLARE_ACCOUNT_ID');
  const authToken = getTrimmedEnv('CLOUDFLARE_FLAGSHIP_API_TOKEN');

  const missing: string[] = [];
  if (!appId) missing.push('FLAGSHIP_APP_ID');
  if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!authToken) missing.push('CLOUDFLARE_FLAGSHIP_API_TOKEN');

  if (missing.length > 0) {
    throw new Error(
      `Flagship is not configured. Set ${missing.join(', ')} in .env.local (see .env.example). ` +
        'Create flags in Cloudflare dashboard: Compute → Flagship.',
    );
  }

  return { appId: appId!, accountId: accountId!, authToken: authToken! };
}
