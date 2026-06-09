import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';
import { createTestUser, deleteTestUser } from './auth-helpers';
import { createTestCompany } from './offer-helpers';
import { upsertUserCompany } from '../../src/lib/database/companies';
import { TEST_USER_PREFIX } from '../config/constants';
import { resolveSupabaseEnvForApp } from './supabase-env';
import * as fs from 'fs';
import * as path from 'path';

const POOL_FILE_PATH = path.join(__dirname, '..', '.test-user-pool.json');
const POOL_SIZE = 3;

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

function createAdminClient() {
  const { url: supabaseUrl, serviceRoleKey } = resolveSupabaseEnvForApp();

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

function savePool(pool: UserPool): void {
  fs.writeFileSync(POOL_FILE_PATH, JSON.stringify(pool, null, 2), 'utf-8');
}

export function loadPool(): UserPool | null {
  try {
    if (!fs.existsSync(POOL_FILE_PATH)) {
      return null;
    }
    const content = fs.readFileSync(POOL_FILE_PATH, 'utf-8');
    return JSON.parse(content) as UserPool;
  } catch (error) {
    console.warn('Error loading user pool:', error);
    return null;
  }
}

function isAlreadyRegisteredError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes('already been registered')
  );
}

async function resolveExistingPoolUser(
  email: string,
  password: string,
  userType: 'contractor' | 'manager',
): Promise<PoolUser> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    throw new Error(`Failed to resolve existing pool user ${email}: ${error?.message ?? 'No user'}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: relation } = await (adminClient as any)
    .from('user_companies')
    .select('company_id')
    .eq('user_id', data.user.id)
    .eq('is_primary', true)
    .maybeSingle();

  return {
    email,
    password,
    userId: data.user.id,
    companyId: relation?.company_id ?? undefined,
    userType,
  };
}

async function verifyPoolUserCompany(poolUser: PoolUser): Promise<boolean> {
  if (!poolUser.companyId) {
    return false;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('companies')
    .select('id')
    .eq('id', poolUser.companyId)
    .single();

  return !error && !!data;
}

async function verifyPoolUserCredentials(poolUser: PoolUser): Promise<boolean> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.signInWithPassword({
    email: poolUser.email,
    password: poolUser.password,
  });
  return !error;
}

async function isPoolHealthy(pool: UserPool): Promise<boolean> {
  if (pool.contractors.length < POOL_SIZE || pool.managers.length < POOL_SIZE) {
    return false;
  }

  for (const user of [...pool.contractors, ...pool.managers]) {
    if (!(await verifyPoolUserCredentials(user))) {
      return false;
    }
    if (!(await verifyPoolUserCompany(user))) {
      return false;
    }
  }

  return true;
}

async function createPoolContractor(index: number): Promise<PoolUser> {
  const email = `${TEST_USER_PREFIX}pool-contractor-${index}@example.com`;
  const password = 'TestPassword123!';

  try {
    const user = await createTestUser(email, password, 'contractor', {
      firstName: 'Pool',
      lastName: `Contractor ${index}`,
    });
    const company = await createTestCompany(user.id, {
      name: `Pool Contractor Company ${index}`,
    });

    return {
      email,
      password,
      userId: user.id,
      companyId: company.id,
      userType: 'contractor',
    };
  } catch (error) {
    if (!isAlreadyRegisteredError(error)) {
      throw error;
    }

    const existing = await resolveExistingPoolUser(email, password, 'contractor');
    if (!existing.companyId) {
      const company = await createTestCompany(existing.userId, {
        name: `Pool Contractor Company ${index}`,
      });
      existing.companyId = company.id;
    }
    return existing;
  }
}

async function createPoolManager(index: number): Promise<PoolUser> {
  const email = `${TEST_USER_PREFIX}pool-manager-${index}@example.com`;
  const password = 'TestPassword123!';

  try {
    const user = await createTestUser(email, password, 'manager', {
      firstName: 'Pool',
      lastName: `Manager ${index}`,
    });

    const adminClient = createAdminClient();
    const { data: company, error: companyError } = await upsertUserCompany(adminClient, user.id, {
      name: `Pool Manager Company ${index}`,
      type: 'spółdzielnia',
      city: 'Warszawa',
      address: `ul. Pool Manager ${index}`,
      phone: '+48123456789',
      email: `pool-manager-company-${index}@example.com`,
    });

    if (companyError || !company?.id) {
      await deleteTestUser(email).catch(() => undefined);
      throw new Error(`Failed to create manager company: ${companyError?.message ?? 'Unknown error'}`);
    }

    return {
      email,
      password,
      userId: user.id,
      companyId: company.id,
      userType: 'manager',
    };
  } catch (error) {
    if (!isAlreadyRegisteredError(error)) {
      throw error;
    }

    const existing = await resolveExistingPoolUser(email, password, 'manager');
    if (!existing.companyId) {
      const adminClient = createAdminClient();
      const { data: company, error: companyError } = await upsertUserCompany(
        adminClient,
        existing.userId,
        {
          name: `Pool Manager Company ${index}`,
          type: 'spółdzielnia',
          city: 'Warszawa',
          address: `ul. Pool Manager ${index}`,
          phone: '+48123456789',
          email: `pool-manager-company-${index}@example.com`,
        },
      );

      if (companyError || !company?.id) {
        throw new Error(`Failed to ensure manager company: ${companyError?.message ?? 'Unknown error'}`);
      }

      existing.companyId = company.id;
    }

    return existing;
  }
}

/**
 * Reuses a healthy on-disk pool or creates/recovers pool users without destructive cleanup.
 */
export async function ensurePool(): Promise<UserPool | null> {
  const existing = loadPool();
  if (existing && (await isPoolHealthy(existing))) {
    console.log('✓ Reusing existing test user pool');
    return existing;
  }

  const pool: UserPool = { contractors: [], managers: [] };

  for (let i = 1; i <= POOL_SIZE; i++) {
    const contractor = await createPoolContractor(i);
    pool.contractors.push(contractor);
    console.log(`✓ Pool contractor ${i} ready: ${contractor.email}`);
  }

  for (let i = 1; i <= POOL_SIZE; i++) {
    const manager = await createPoolManager(i);
    pool.managers.push(manager);
    console.log(`✓ Pool manager ${i} ready: ${manager.email}`);
  }

  savePool(pool);
  console.log(
    `✓ User pool ready with ${pool.contractors.length} contractors and ${pool.managers.length} managers`,
  );

  return pool;
}

/** @deprecated Use ensurePool() — kept for backwards compatibility */
export async function initializePool(): Promise<UserPool> {
  const pool = await ensurePool();
  if (!pool) {
    throw new Error('Failed to initialize user pool');
  }
  return pool;
}

export async function getPoolContractor(index?: number): Promise<PoolUser | null> {
  const pool = loadPool();
  if (!pool || pool.contractors.length === 0) {
    return null;
  }

  const idx = index !== undefined ? index % pool.contractors.length : 0;
  const contractor = pool.contractors[idx];

  const isValid = await verifyPoolUserCompany(contractor);
  if (!isValid) {
    throw new Error(
      `Pool contractor ${contractor.email} has invalid company_id (${contractor.companyId}). Re-run global setup.`,
    );
  }

  return contractor;
}

export async function getPoolManager(index?: number): Promise<PoolUser | null> {
  const pool = loadPool();
  if (!pool || pool.managers.length === 0) {
    return null;
  }

  const idx = index !== undefined ? index % pool.managers.length : 0;
  const manager = pool.managers[idx];

  const isValid = await verifyPoolUserCompany(manager);
  if (!isValid) {
    throw new Error(
      `Pool manager ${manager.email} has invalid company_id (${manager.companyId}). Re-run global setup.`,
    );
  }

  return manager;
}

export async function cleanupPool(): Promise<void> {
  const pool = loadPool();
  if (!pool) {
    return;
  }

  const adminClient = createAdminClient();
  const allUsers = [...pool.contractors, ...pool.managers];

  for (const user of allUsers) {
    try {
      if (user.companyId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient as any).from('user_companies').delete().eq('company_id', user.companyId);
      }

      await deleteTestUser(user.email);

      if (user.companyId) {
        await adminClient.from('companies').delete().eq('id', user.companyId);
      }
    } catch (error) {
      console.warn(`Error deleting pool user ${user.email} (non-critical):`, error);
    }
  }

  if (fs.existsSync(POOL_FILE_PATH)) {
    fs.unlinkSync(POOL_FILE_PATH);
  }

  console.log(`✓ Cleaned up ${allUsers.length} pool users`);
}
