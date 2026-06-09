import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let cachedAppEnv: Record<string, string> | null = null;

function loadAppEnv(): Record<string, string> {
  if (cachedAppEnv) {
    return cachedAppEnv;
  }

  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  cachedAppEnv = fs.existsSync(envLocalPath)
    ? dotenv.parse(fs.readFileSync(envLocalPath, 'utf8'))
    : {};

  return cachedAppEnv;
}

export function shouldUseLocalSupabaseForE2E(): boolean {
  return process.env.E2E_USE_LOCAL_SUPABASE === 'true';
}

/** Pool users are not needed for seeded-account specs (e.g. zarzadca3). */
export function shouldSkipPoolUsers(): boolean {
  if (process.env.E2E_SKIP_POOL_USERS === 'true') {
    return true;
  }

  const args = process.argv.join(' ');
  return (
    args.includes('manager-contest-creation') ||
    args.includes('contractor-verification-submission')
  );
}

export function resolveSupabaseEnvForApp(): {
  url: string;
  publishableKey: string | undefined;
  serviceRoleKey: string | undefined;
} {
  const appEnv = loadAppEnv();
  const useLocal = shouldUseLocalSupabaseForE2E();

  const url = useLocal
    ? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    : appEnv.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const publishableKey = useLocal
    ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    : appEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const serviceRoleKey = useLocal
    ? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    : appEnv.SUPABASE_SECRET_KEY ??
      appEnv.SUPABASE_SERVICE_ROLE_KEY ??
      appEnv.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, publishableKey, serviceRoleKey };
}

/** Env vars for Playwright webServer so Next.js auth hits the same Supabase as `.env.local`. */
function buildSupabaseEnvRecord(): Record<string, string> {
  const { url, publishableKey, serviceRoleKey } = resolveSupabaseEnvForApp();

  if (!url) {
    return {};
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    ...(publishableKey ? { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey } : {}),
    ...(serviceRoleKey ? { SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } : {}),
  };
}

/**
 * After dotenv loads `.env.test.local` then `.env.local`, process.env may still
 * point at localhost. Apply the resolved app Supabase vars for admin/setup code.
 */
export function applyResolvedSupabaseEnvToProcess(): void {
  if (shouldUseLocalSupabaseForE2E()) {
    return;
  }

  const env = buildSupabaseEnvRecord();
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

export function isLocalSupabaseUrl(url: string): boolean {
  return (
    url.includes('localhost') || url.includes('127.0.0.1') || url.includes(':54321')
  );
}

/** Env vars for Playwright webServer so Next.js auth hits the same Supabase as `.env.local`. */
export function getWebServerSupabaseEnv(): Record<string, string> {
  if (shouldUseLocalSupabaseForE2E()) {
    return {};
  }

  return buildSupabaseEnvRecord();
}
