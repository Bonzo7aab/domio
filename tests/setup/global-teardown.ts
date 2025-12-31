import { FullConfig } from '@playwright/test';
import { cleanupTestUsers } from '../helpers/auth-helpers';
import { cleanupPool } from '../helpers/test-user-pool';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    try {
      // Clean up pool users first
      await cleanupPool();
      console.log('✓ Pool users cleaned up');
      
      // Clean up any leftover test users
      await cleanupTestUsers();
      console.log('✓ Test users cleaned up');
    } catch (error) {
      console.warn('Failed to cleanup test users during teardown:', error);
    }
  } else {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Skipping test user cleanup.');
  }

  console.log('Global teardown complete.');
}

export default globalTeardown;



