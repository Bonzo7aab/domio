import { test as base, Page } from '@playwright/test';
import { createTestUser, deleteTestUser, loginViaUI, clearAuthState } from '../helpers/auth-helpers';
import { getPoolContractor, getPoolManager } from '../helpers/test-user-pool';

type UserCredentials = {
  email: string;
  password: string;
  userType: 'manager' | 'contractor';
  userId?: string;
};

type AuthFixtures = {
  authenticatedPage: Page;
  managerPage: Page;
  contractorPage: Page;
  testUser: UserCredentials;
};

/**
 * Creates a page with an authenticated user
 */
async function createAuthenticatedPage(
  page: Page,
  email: string,
  password: string,
  _userType: 'manager' | 'contractor'
): Promise<Page> {
  // Clear any existing auth state
  await clearAuthState(page);

  // Login via UI
  await loginViaUI(page, email, password);

  // Verify we're authenticated by checking we're not on login page
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Failed to authenticate user');
  }

  return page;
}

export const test = base.extend<AuthFixtures>({
  /**
   * Page with a pre-authenticated test user (contractor by default)
   * Uses pool user instead of creating a new one
   */
  authenticatedPage: async ({ page }, use) => {
    const poolUser = await getPoolContractor();
    
    if (!poolUser) {
      throw new Error('Pool contractor not available. Make sure global setup has run.');
    }

    try {
      // Authenticate the page with pool user
      const authenticatedPage = await createAuthenticatedPage(page, poolUser.email, poolUser.password, poolUser.userType);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(authenticatedPage);
    } finally {
      // Clear auth state but don't delete pool user
      await clearAuthState(page);
    }
  },

  /**
   * Page with a pre-authenticated manager user
   * Uses pool user instead of creating a new one
   */
  managerPage: async ({ page }, use) => {
    const poolUser = await getPoolManager();
    
    if (!poolUser) {
      throw new Error('Pool manager not available. Make sure global setup has run.');
    }

    try {
      // Authenticate the page with pool user
      const authenticatedPage = await createAuthenticatedPage(page, poolUser.email, poolUser.password, poolUser.userType);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(authenticatedPage);
    } finally {
      // Clear auth state but don't delete pool user
      await clearAuthState(page);
    }
  },

  /**
   * Page with a pre-authenticated contractor user
   * Uses pool user instead of creating a new one
   */
  contractorPage: async ({ page }, use) => {
    const poolUser = await getPoolContractor();
    
    if (!poolUser) {
      throw new Error('Pool contractor not available. Make sure global setup has run.');
    }

    try {
      // Authenticate the page with pool user
      const authenticatedPage = await createAuthenticatedPage(page, poolUser.email, poolUser.password, poolUser.userType);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(authenticatedPage);
    } finally {
      // Clear auth state but don't delete pool user
      await clearAuthState(page);
    }
  },

  /**
   * Test user credentials (user is created but not authenticated)
   */
  testUser: async (_unused, use) => {
    const email = `test-playwright-user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';
    const userType = 'contractor';

    // Create test user
    const user = await createTestUser(email, password, userType, {
      firstName: 'Test',
      lastName: 'User',
    });

    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use({
        email,
        password,
        userType,
        userId: user.id,
      });
    } finally {
      // Cleanup: delete test user
      await deleteTestUser(email);
    }
  },
});

export { expect } from '@playwright/test';



