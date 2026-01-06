import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';
import { createTestUser, deleteTestUser } from './auth-helpers';
import { createTestCompany } from './offer-helpers';
import { upsertUserCompany } from '../../src/lib/database/companies';
import { TEST_USER_PREFIX } from '../config/constants';
import * as fs from 'fs';
import * as path from 'path';

const POOL_FILE_PATH = path.join(__dirname, '..', '.test-user-pool.json');

export interface PoolUser {
  email: string;
  password: string;
  userId: string;
  companyId?: string;
  userType: 'contractor' | 'manager';
}

export interface UserPool {
  contractors: PoolUser[];
  managers: PoolUser[];
}

/**
 * Creates a Supabase admin client for test data management
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Saves the user pool to a JSON file
 */
function savePool(pool: UserPool): void {
  try {
    fs.writeFileSync(POOL_FILE_PATH, JSON.stringify(pool, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving user pool:', error);
    throw error;
  }
}

/**
 * Loads the user pool from a JSON file
 */
export function loadPool(): UserPool | null {
  try {
    if (!fs.existsSync(POOL_FILE_PATH)) {
      return null;
    }
    const content = fs.readFileSync(POOL_FILE_PATH, 'utf-8');
    return JSON.parse(content) as UserPool;
  } catch (error) {
    console.error('Error loading user pool:', error);
    return null;
  }
}

/**
 * Initializes the test user pool with contractors and managers
 */
export async function initializePool(): Promise<UserPool> {
  // Clean up any existing pool users first
  await cleanupPool();

  const pool: UserPool = {
    contractors: [],
    managers: [],
  };

  // Create 3 contractor users with companies
  for (let i = 1; i <= 3; i++) {
    const email = `${TEST_USER_PREFIX}pool-contractor-${i}@example.com`;
    const password = 'TestPassword123!';

    try {
      const user = await createTestUser(email, password, 'contractor', {
        firstName: `Pool`,
        lastName: `Contractor ${i}`,
      });

      const company = await createTestCompany(user.id, {
        name: `Pool Contractor Company ${i}`,
      });

      pool.contractors.push({
        email,
        password,
        userId: user.id,
        companyId: company.id,
        userType: 'contractor',
      });

      console.log(`✓ Created pool contractor ${i}: ${email}`);
    } catch (error) {
      console.error(`Error creating pool contractor ${i}:`, error);
      throw error;
    }
  }

  // Create 3 manager users with companies
  for (let i = 1; i <= 3; i++) {
    const email = `${TEST_USER_PREFIX}pool-manager-${i}@example.com`;
    const password = 'TestPassword123!';

    try {
      const user = await createTestUser(email, password, 'manager', {
        firstName: `Pool`,
        lastName: `Manager ${i}`,
      });

      const adminClient = createAdminClient();

      // Create company for manager using upsertUserCompany
      const { data: company, error: companyError } = await upsertUserCompany(adminClient, user.id, {
        name: `Pool Manager Company ${i}`,
        type: 'spółdzielnia',
        city: 'Warszawa',
        address: `ul. Pool Manager ${i}`,
        phone: '+48123456789',
        email: `pool-manager-company-${i}@example.com`,
      });

      if (companyError || !company || !company.id) {
        await deleteTestUser(email);
        throw new Error(`Failed to create manager company: ${companyError?.message || 'Company was not created'}`);
      }

      // Verify company actually exists in database
      const { data: verifyCompany, error: verifyError } = await adminClient
        .from('companies')
        .select('id')
        .eq('id', company.id)
        .single();

      if (verifyError || !verifyCompany) {
        await deleteTestUser(email);
        throw new Error(`Manager company was created but could not be verified: ${verifyError?.message || 'Company not found'}`);
      }

      pool.managers.push({
        email,
        password,
        userId: user.id,
        companyId: company.id,
        userType: 'manager',
      });

      console.log(`✓ Created pool manager ${i}: ${email}`);
    } catch (error) {
      console.error(`Error creating pool manager ${i}:`, error);
      throw error;
    }
  }

  // Save pool to file
  savePool(pool);
  console.log(`✓ User pool initialized with ${pool.contractors.length} contractors and ${pool.managers.length} managers`);

  return pool;
}

/**
 * Verifies that a pool user's company exists in the database
 */
async function verifyPoolUserCompany(poolUser: PoolUser): Promise<boolean> {
  if (!poolUser.companyId) {
    return false;
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('companies')
      .select('id')
      .eq('id', poolUser.companyId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Gets a contractor from the pool (round-robin selection)
 * Validates that the company exists before returning
 * Throws error if company is invalid (pool needs reinitialization)
 */
export async function getPoolContractor(index?: number): Promise<PoolUser | null> {
  const pool = loadPool();
  if (!pool || pool.contractors.length === 0) {
    return null;
  }

  const idx = index !== undefined ? index % pool.contractors.length : 0;
  const contractor = pool.contractors[idx];

  // Verify company exists
  const isValid = await verifyPoolUserCompany(contractor);
  if (!isValid) {
    throw new Error(
      `Pool contractor ${contractor.email} has invalid company_id (${contractor.companyId}). ` +
      `The pool needs to be reinitialized. This usually means companies were deleted. ` +
      `Run global setup again or check database state.`
    );
  }

  return contractor;
}

/**
 * Gets a manager from the pool (round-robin selection)
 * Validates that the company exists before returning
 * Throws error if company is invalid (pool needs reinitialization)
 */
export async function getPoolManager(index?: number): Promise<PoolUser | null> {
  const pool = loadPool();
  if (!pool || pool.managers.length === 0) {
    return null;
  }

  const idx = index !== undefined ? index % pool.managers.length : 0;
  const manager = pool.managers[idx];

  // Verify company exists
  const isValid = await verifyPoolUserCompany(manager);
  if (!isValid) {
    throw new Error(
      `Pool manager ${manager.email} has invalid company_id (${manager.companyId}). ` +
      `The pool needs to be reinitialized. This usually means companies were deleted. ` +
      `Run global setup again or check database state.`
    );
  }

  return manager;
}

/**
 * Cleans up all pool users
 */
export async function cleanupPool(): Promise<void> {
  const pool = loadPool();
  if (!pool) {
    return;
  }

  const adminClient = createAdminClient();

  // Delete all pool users and their companies
  const allUsers = [...pool.contractors, ...pool.managers];
  for (const user of allUsers) {
    try {
      // Delete user-company relations first
      if (user.companyId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (adminClient as any)
            .from('user_companies')
            .delete()
            .eq('company_id', user.companyId);
        } catch {
          // Ignore errors if relation doesn't exist
        }
      }

      // Delete the user (this may cascade delete some relations)
      await deleteTestUser(user.email);

      // Delete the company if it exists
      if (user.companyId) {
        try {
          await adminClient
            .from('companies')
            .delete()
            .eq('id', user.companyId);
        } catch {
          // Ignore errors if company doesn't exist
        }
      }
    } catch (error) {
      console.error(`Error deleting pool user ${user.email}:`, error);
    }
  }

  // Delete pool file
  try {
    if (fs.existsSync(POOL_FILE_PATH)) {
      fs.unlinkSync(POOL_FILE_PATH);
    }
  } catch (error) {
    console.error('Error deleting pool file:', error);
  }

  console.log(`✓ Cleaned up ${allUsers.length} pool users`);
}

