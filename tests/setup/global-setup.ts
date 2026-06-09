import { chromium, FullConfig } from '@playwright/test';
import { cleanupTestUsers } from '../helpers/auth-helpers';
import { ensurePool, cleanupPool } from '../helpers/test-user-pool';
import {
  isLocalSupabaseUrl,
  resolveSupabaseEnvForApp,
  shouldSkipPoolUsers,
  shouldUseLocalSupabaseForE2E,
} from '../helpers/supabase-env';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');

  const { url: supabaseUrl, serviceRoleKey } = resolveSupabaseEnvForApp();

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  const isLocal = shouldUseLocalSupabaseForE2E() && isLocalSupabaseUrl(supabaseUrl);
  
  if (isLocal) {
    console.log('✓ Using local Supabase instance (isolated test database)');
    console.log('  This is safe - no risk to production data!');
  } else {
    console.log('✓ Using app Supabase from .env.local (seeded-user E2E)');
    console.warn('  Ensure this is a TEST project, not production!');
    
    // Safety check: warn if it looks like production
    if (!supabaseUrl.includes('test') && !supabaseUrl.includes('localhost')) {
      console.warn('  ⚠️  WARNING: This does not appear to be a test project URL!');
      console.warn('  Consider using local Supabase: npm run supabase:setup');
    }
  }

  if (!serviceRoleKey) {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Test user cleanup may not work.');
  }

  const skipPool = shouldSkipPoolUsers();

  if (skipPool) {
    console.log('✓ Skipping test user pool (seeded-user E2E — pool not required)');
  } else if (serviceRoleKey) {
    // Best-effort cleanup; auth admin listUsers may fail on some cloud key configs.
    try {
      await cleanupPool();
      await cleanupTestUsers();
    } catch (error) {
      console.warn('Failed to cleanup test users during setup (non-critical):', error);
    }

    try {
      const pool = await ensurePool();
      if (pool) {
        console.warn('⚠️  Pool users ready (deprecated). Prefer createUniqueTestUsers() for new tests.');
      }
    } catch (error) {
      console.warn('Failed to ensure test user pool (non-critical):', error);
      console.warn('  Continuing without pool users.');
    }
  } else {
    console.warn('Warning: Cannot initialize test user pool without SUPABASE_SERVICE_ROLE_KEY');
  }

  // Verify the app is accessible
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(baseURL, { timeout: 30000 });
    console.log(`✓ Application is accessible at ${baseURL}`);
  } catch {
    console.warn(`Warning: Could not access application at ${baseURL}. Make sure the dev server is running.`);
  } finally {
    await browser.close();
  }

  console.log('Global setup complete.');
}

export default globalSetup;



