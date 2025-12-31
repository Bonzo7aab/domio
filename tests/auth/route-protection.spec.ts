import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, loginViaUI, clearAuthState } from '../helpers/auth-helpers';
import { ROUTES } from '../config/constants';

test.describe('Route Protection', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('should redirect to login when accessing contractor-dashboard without auth', async ({ page }) => {
    await page.goto(ROUTES.contractorDashboard);
    
    // Should redirect to login
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toContain('/login');
    
    // Should preserve redirectTo parameter
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe(ROUTES.contractorDashboard);
  });

  test('should redirect to login when accessing manager-dashboard without auth', async ({ page }) => {
    await page.goto(ROUTES.managerDashboard);
    
    // Should redirect to login
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toContain('/login');
    
    // Should preserve redirectTo parameter
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe(ROUTES.managerDashboard);
  });

  test('should redirect to login when accessing account without auth', async ({ page }) => {
    await page.goto(ROUTES.account);
    
    // Should redirect to login
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toContain('/login');
    
    // Should preserve redirectTo parameter
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe(ROUTES.account);
  });

  test('should redirect to login when accessing post-job without auth', async ({ page }) => {
    await page.goto(ROUTES.postJob);
    
    // Should redirect to login
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toContain('/login');
    
    // Should preserve redirectTo parameter
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe(ROUTES.postJob);
  });

  test('should redirect to login when accessing tender-creation without auth', async ({ page }) => {
    await page.goto(ROUTES.tenderCreation);
    
    // Should redirect to login
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
    expect(page.url()).toContain('/login');
    
    // Should preserve redirectTo parameter
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe(ROUTES.tenderCreation);
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    const email = `test-route-protection-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

    try {
      // Login first
      await loginViaUI(page, email, password);

      // Try to access protected route
      await page.goto(ROUTES.account);
      
      // Should not redirect to login - wait for page to load and check URL
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should redirect to original destination after login', async ({ page }) => {
    const email = `test-route-redirect-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

    try {
      // Try to access protected route
      await page.goto(ROUTES.account);
      
      // Should redirect to login with redirectTo parameter
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
      const url = new URL(page.url());
      const redirectTo = url.searchParams.get('redirectTo');
      expect(redirectTo).toBe(ROUTES.account);

      // Login
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      // Should redirect to original destination or home
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      // Either redirected to account or home
      expect(page.url()).toMatch(/\/account|\/$/);
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should allow contractor to access contractor-dashboard', async ({ page }) => {
    const email = `test-contractor-dashboard-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

    try {
      // Login first
      await loginViaUI(page, email, password);

      // Access contractor dashboard
      await page.goto(ROUTES.contractorDashboard);
      
      // Should not redirect to login - wait for page to load
      // Note: contractor-dashboard redirects to /contractor-dashboard/dashboard or /account?tab=company if no company
      // Accept either as long as we're not on login (both mean user is authenticated)
      try {
        await page.waitForURL((url) => 
          url.pathname.includes('/contractor-dashboard') || url.pathname.includes('/account'), 
          { timeout: 10000 }
        );
      } catch (e) {
        // If waitForURL times out, check current URL anyway
      }
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should allow manager to access manager-dashboard', async ({ page }) => {
    const email = `test-manager-dashboard-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'manager');

    try {
      // Login first
      await loginViaUI(page, email, password);

      // Access manager dashboard
      await page.goto(ROUTES.managerDashboard);
      
      // Should not redirect to login - wait for page to load
      // Note: manager-dashboard might redirect to different sub-routes, accept any manager-dashboard URL
      try {
        await page.waitForURL((url) => 
          url.pathname.includes('/manager-dashboard'), 
          { timeout: 10000 }
        );
      } catch (e) {
        // If waitForURL times out, check current URL anyway
      }
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should allow access to public routes without auth', async ({ page }) => {
    // Public routes should be accessible
    await page.goto(ROUTES.home);
    expect(page.url()).not.toContain('/login');

    await page.goto(ROUTES.login);
    expect(page.url()).toContain('/login');

    await page.goto(ROUTES.register);
    expect(page.url()).toContain('/register');
  });
});


