import { FullConfig } from '@playwright/test';
import { cleanupTestUsers } from '../helpers/auth-helpers';
import { cleanupPool } from '../helpers/test-user-pool';

async function globalTeardown(_config: FullConfig) {
  console.log('Running global teardown...');

  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    try {
      // Clean up pool users first (deprecated, but still cleanup for safety)
      try {
        await cleanupPool();
        console.log('✓ Pool users cleaned up');
      } catch (error) {
        console.warn('Failed to cleanup pool users (non-critical):', error);
        // Continue with other cleanup even if pool cleanup fails
      }
      
      // Clean up any leftover test users
      try {
        await cleanupTestUsers();
        console.log('✓ Test users cleaned up');
      } catch (error) {
        console.warn('Failed to cleanup test users (non-critical):', error);
        // Don't fail teardown if cleanup has issues
      }
    } catch (error) {
      console.warn('Unexpected error during teardown:', error);
      // Don't throw - teardown should be resilient
    }
  } else {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Skipping test user cleanup.');
  }

  console.log('Global teardown complete.');
}

export default globalTeardown;



