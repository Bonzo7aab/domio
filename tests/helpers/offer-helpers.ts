import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';
import { createTestUser, deleteTestUser } from './auth-helpers';
import { TEST_USER_PREFIX } from '../config/constants';
import { createJob } from '../../src/lib/database/jobs';
import { createTender } from '../../src/lib/database/jobs';
import { upsertUserCompany } from '../../src/lib/database/companies';
import { getPoolContractor, getPoolManager, loadPool } from './test-user-pool';

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
 * Creates a test company for a contractor
 */
export async function createTestCompany(
  userId: string,
  companyData?: {
    name?: string;
    type?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
) {
  const adminClient = createAdminClient();

  const companyInfo = {
    name: companyData?.name || `Test Company ${Date.now()}`,
    type: companyData?.type || 'contractor',
    city: companyData?.city || 'Warszawa',
    address: companyData?.address || 'ul. Testowa 123',
    phone: companyData?.phone || '+48123456789',
    email: companyData?.email || `test-company-${Date.now()}@example.com`,
  };

  const { data: company, error } = await upsertUserCompany(adminClient, userId, {
    name: companyInfo.name,
    type: companyInfo.type,
    city: companyInfo.city,
    address: companyInfo.address,
    phone: companyInfo.phone,
    email: companyInfo.email,
  });

  if (error || !company) {
    throw new Error(`Failed to create test company: ${error?.message || 'Unknown error'}`);
  }

  return company;
}

/**
 * Gets a pool manager user (reuses existing pool user)
 * @deprecated Use createUniqueTestUsers() instead for better test isolation. Pool users can cause race conditions in parallel tests.
 */
export async function getPoolManagerUser(index?: number): Promise<{ user: { id: string }; company: { id: string }; email: string; password: string }> {
  const poolUser = await getPoolManager(index);
  
  if (!poolUser || !poolUser.companyId) {
    throw new Error('Pool manager not available. Make sure global setup has run and pool users are valid.');
  }

  return {
    user: { id: poolUser.userId },
    company: { id: poolUser.companyId },
    email: poolUser.email,
    password: poolUser.password,
  };
}

/**
 * Gets a pool contractor user (reuses existing pool user)
 * @deprecated Use createUniqueTestUsers() instead for better test isolation. Pool users can cause race conditions in parallel tests.
 */
export async function getPoolContractorUser(index?: number): Promise<{ user: { id: string }; company: { id: string }; email: string; password: string }> {
  const poolUser = await getPoolContractor(index);
  
  if (!poolUser || !poolUser.companyId) {
    throw new Error('Pool contractor not available. Make sure global setup has run and pool users are valid.');
  }

  return {
    user: { id: poolUser.userId },
    company: { id: poolUser.companyId },
    email: poolUser.email,
    password: poolUser.password,
  };
}

/**
 * Creates a test manager user with company
 * Note: For tests that don't specifically test user creation, use createUniqueTestUsers() instead
 */
export async function createTestManager() {
  const email = `${TEST_USER_PREFIX}manager-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'TestPassword123!';

  const user = await createTestUser(email, password, 'manager', {
    firstName: 'Test',
    lastName: 'Manager',
  });

  const adminClient = createAdminClient();

  // Create company for manager
  const { data: company, error: companyError } = await upsertUserCompany(adminClient, user.id, {
    name: `Test Manager Company ${Date.now()}`,
    type: 'spółdzielnia',
    city: 'Warszawa',
    address: 'ul. Managerowa 456',
    phone: '+48987654321',
    email: `manager-company-${Date.now()}@example.com`,
  });

  if (companyError || !company) {
    await deleteTestUser(email);
    throw new Error(`Failed to create manager company: ${companyError?.message || 'Unknown error'}`);
  }

  return {
    user,
    company,
    email,
    password,
  };
}

/**
 * Creates unique test users (contractor and manager) with companies for test isolation.
 * This is the recommended approach for tests to avoid race conditions and shared state issues.
 * 
 * @returns Object containing contractor and manager users with their companies
 * @example
 * ```typescript
 * const { contractor, manager } = await createUniqueTestUsers();
 * // Use contractor.email, contractor.password, contractor.user.id, contractor.company.id
 * // Use manager.email, manager.password, manager.user.id, manager.company.id
 * ```
 */
export async function createUniqueTestUsers(): Promise<{
  contractor: { user: { id: string }; company: { id: string }; email: string; password: string };
  manager: { user: { id: string }; company: { id: string }; email: string; password: string };
}> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Create contractor
  const contractorEmail = `${TEST_USER_PREFIX}contractor-${uniqueId}@example.com`;
  const contractorPassword = 'TestPassword123!';
  
  const contractorUser = await createTestUser(contractorEmail, contractorPassword, 'contractor', {
    firstName: 'Test',
    lastName: 'Contractor',
  });
  
  const contractorCompany = await createTestCompany(contractorUser.id, {
    name: `Test Contractor Company ${uniqueId}`,
  });
  
  // Create manager
  const managerEmail = `${TEST_USER_PREFIX}manager-${uniqueId}@example.com`;
  const managerPassword = 'TestPassword123!';
  
  const managerUser = await createTestUser(managerEmail, managerPassword, 'manager', {
    firstName: 'Test',
    lastName: 'Manager',
  });
  
  const adminClient = createAdminClient();
  const { data: managerCompany, error: companyError } = await upsertUserCompany(adminClient, managerUser.id, {
    name: `Test Manager Company ${uniqueId}`,
    type: 'spółdzielnia',
    city: 'Warszawa',
    address: 'ul. Managerowa 456',
    phone: '+48987654321',
    email: `manager-company-${uniqueId}@example.com`,
  });
  
  if (companyError || !managerCompany) {
    // Cleanup contractor if manager company creation fails
    await deleteTestUser(contractorEmail);
    await deleteTestUser(managerEmail);
    throw new Error(`Failed to create manager company: ${companyError?.message || 'Unknown error'}`);
  }
  
  return {
    contractor: {
      user: { id: contractorUser.id },
      company: { id: contractorCompany.id },
      email: contractorEmail,
      password: contractorPassword,
    },
    manager: {
      user: { id: managerUser.id },
      company: { id: managerCompany.id },
      email: managerEmail,
      password: managerPassword,
    },
  };
}

/**
 * Creates a test regular job
 */
export async function createTestJob(
  managerId: string,
  companyId: string,
  jobData?: {
    title?: string;
    description?: string;
    category?: string;
    location?: string;
    budgetMin?: number;
    budgetMax?: number;
  }
) {
  const adminClient = createAdminClient();

  const jobInfo = {
    title: jobData?.title || `Test Job ${Date.now()}`,
    description: jobData?.description || 'This is a test job description for E2E testing.',
    category: jobData?.category || 'Remonty i Budownictwo',
    location: jobData?.location || 'Warszawa',
    budgetMin: jobData?.budgetMin || 10000,
    budgetMax: jobData?.budgetMax || 20000,
  };

  const { data: job, error } = await createJob(adminClient, {
    title: jobInfo.title,
    description: jobInfo.description,
    category: jobInfo.category,
    location: jobInfo.location,
    budgetMin: jobInfo.budgetMin,
    budgetMax: jobInfo.budgetMax,
    budgetType: 'range',
    currency: 'PLN',
    urgency: 'medium',
    status: 'active',
    type: 'regular',
    managerId,
    companyId,
  });

  if (error || !job) {
    throw new Error(`Failed to create test job: ${error?.message || 'Unknown error'}`);
  }

  return job;
}

/**
 * Creates a test tender
 */
export async function createTestTender(
  managerId: string,
  companyId: string,
  tenderData?: {
    title?: string;
    description?: string;
    category?: string;
    location?: string;
    estimatedValue?: string;
  }
) {
  const adminClient = createAdminClient();

  const submissionDeadline = new Date();
  submissionDeadline.setDate(submissionDeadline.getDate() + 30); // 30 days from now

  const evaluationDeadline = new Date();
  evaluationDeadline.setDate(evaluationDeadline.getDate() + 45); // 45 days from now

  const tenderInfo = {
    title: tenderData?.title || `Test Tender ${Date.now()}`,
    description: tenderData?.description || 'This is a test tender description for E2E testing.',
    category: tenderData?.category || 'Remonty i Budownictwo',
    location: tenderData?.location || 'Warszawa',
    estimatedValue: tenderData?.estimatedValue || '100000',
  };

  const { data: tender, error } = await createTender(adminClient, {
    title: tenderInfo.title,
    description: tenderInfo.description,
    category: tenderInfo.category,
    location: tenderInfo.location,
    estimatedValue: tenderInfo.estimatedValue,
    currency: 'PLN',
    submissionDeadline,
    evaluationDeadline,
    requirements: ['Requirement 1', 'Requirement 2'],
    evaluationCriteria: [
      {
        id: '1',
        name: 'Price',
        description: 'Price evaluation',
        weight: 50,
        type: 'price',
      },
      {
        id: '2',
        name: 'Quality',
        description: 'Quality evaluation',
        weight: 50,
        type: 'quality',
      },
    ],
    isPublic: true,
    allowQuestions: true,
    minimumExperience: 2,
    requiredCertificates: [],
    insuranceRequired: 'required',
    advancePayment: false,
    performanceBond: false,
    status: 'active',
    managerId,
    companyId,
  });

  if (error || !tender) {
    throw new Error(`Failed to create test tender: ${error?.message || 'Unknown error'}`);
  }

  return tender;
}

/**
 * Cleans up test data (jobs, tenders, companies, users)
 * Note: Pool user companies are NOT deleted here - they're shared resources
 */
export async function cleanupTestData(
  jobIds: string[] = [],
  tenderIds: string[] = [],
  companyIds: string[] = [],
  userEmails: string[] = []
) {
  const adminClient = createAdminClient();

  // Get pool companies to exclude them from cleanup
  const pool = loadPool();
  const poolCompanyIds = new Set<string>();
  if (pool) {
    [...pool.contractors, ...pool.managers].forEach(user => {
      if (user.companyId) {
        poolCompanyIds.add(user.companyId);
      }
    });
  }

  // Filter out pool companies from cleanup
  const companiesToDelete = companyIds.filter(id => !poolCompanyIds.has(id));

  // Delete jobs
  if (jobIds.length > 0) {
    const { error: jobsError } = await adminClient
      .from('jobs')
      .delete()
      .in('id', jobIds);
    
    if (jobsError) {
      console.error('Error cleaning up jobs:', jobsError);
    }
  }

  // Delete tenders BEFORE companies (to avoid foreign key violations)
  if (tenderIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: tendersError } = await (adminClient as any)
      .from('tenders')
      .delete()
      .in('id', tenderIds);
    
    if (tendersError) {
      console.error('Error cleaning up tenders:', tendersError);
    }
  }

  // Delete user-company relationships (only for non-pool companies)
  if (companiesToDelete.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: relationsError } = await (adminClient as any)
      .from('user_companies')
      .delete()
      .in('company_id', companiesToDelete);
    
    if (relationsError) {
      console.error('Error cleaning up user-company relations:', relationsError);
    }
  }

  // Delete companies (only non-pool companies)
  if (companiesToDelete.length > 0) {
    const { error: companiesError } = await adminClient
      .from('companies')
      .delete()
      .in('id', companiesToDelete);
    
    if (companiesError) {
      console.error('Error cleaning up companies:', companiesError);
    }
  }

  // Delete users
  for (const email of userEmails) {
    await deleteTestUser(email);
  }
}

/**
 * Gets a default category from the database (for fallback)
 */
export async function getDefaultCategory(): Promise<string> {
  const adminClient = createAdminClient();

  const { data: categories, error } = await adminClient
    .from('job_categories')
    .select('name')
    .eq('is_active', true)
    .limit(1);

  if (error || !categories || categories.length === 0) {
    return 'Remonty i Budownictwo'; // Fallback
  }

  return categories[0].name;
}

