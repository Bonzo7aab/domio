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

  // Detect if using local Supabase
  const isLocal = supabaseUrl?.includes('localhost') || 
                  supabaseUrl?.includes('127.0.0.1') ||
                  supabaseUrl?.includes(':54321');
  
  if (isLocal) {
    console.log('✓ Using local Supabase instance (isolated test database)');
    console.log('  This is safe - no risk to production data!');
  } else {
    console.warn('⚠️  Using remote Supabase instance');
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

  // Clean up any leftover test users and pool users from previous runs
  if (serviceRoleKey) {
    try {
      await cleanupPool();
      await cleanupTestUsers();
    } catch (error) {
      console.warn('Failed to cleanup test users during setup:', error);
      // Don't fail setup if cleanup fails - tests can still run
    }
  }

  // Initialize test user pool (deprecated - kept for backward compatibility)
  // Note: New tests should use createUniqueTestUsers() instead for better isolation
  if (serviceRoleKey) {
    try {
      await initializePool();
      console.warn('⚠️  Pool users initialized (deprecated).');
      console.warn('  Consider migrating tests to use createUniqueTestUsers() for better test isolation.');
    } catch (error) {
      console.error('Failed to initialize test user pool:', error);
      // Don't fail setup - pool users are optional and deprecated
      console.warn('  Continuing without pool users. Tests using createUniqueTestUsers() will still work.');
    }
  } else {
    console.warn('Warning: Cannot initialize test user pool without SUPABASE_SERVICE_ROLE_KEY');
    console.warn('  Tests using createUniqueTestUsers() will still work.');
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



