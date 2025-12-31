import { chromium, FullConfig } from '@playwright/test';
import { cleanupTestUsers } from '../helpers/auth-helpers';
import { initializePool, cleanupPool } from '../helpers/test-user-pool';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');

  // Verify Supabase connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Test user cleanup may not work.');
  }

  // Clean up any leftover test users and pool users from previous runs
  if (serviceRoleKey) {
    try {
      await cleanupPool();
      await cleanupTestUsers();
    } catch (error) {
      console.warn('Failed to cleanup test users during setup:', error);
    }
  }

  // Initialize test user pool
  if (serviceRoleKey) {
    try {
      await initializePool();
    } catch (error) {
      console.error('Failed to initialize test user pool:', error);
      throw error;
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
  } catch (error) {
    console.warn(`Warning: Could not access application at ${baseURL}. Make sure the dev server is running.`);
  } finally {
    await browser.close();
  }

  console.log('Global setup complete.');
}

export default globalSetup;



