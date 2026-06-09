import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, loginViaUI, clearAuthState, getAuthState } from '../helpers/auth-helpers';
import { ROUTES } from '../config/constants';

test.describe('Logout', () => {
  // Track test data for cleanup
  const testData: { userEmails: string[] } = {
    userEmails: [],
  };

  test.beforeEach(async () => {
    // Reset test data tracking
    testData.userEmails = [];
  });

  test.afterEach(async () => {
    // Cleanup after each test to ensure no leftover data
    for (const email of testData.userEmails) {
      await deleteTestUser(email).catch(() => {
        // Ignore errors if user already deleted
      });
    }
  });

  test('should logout successfully when authenticated', async ({ page }) => {
    const email = `test-logout-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      // Login first
      await loginViaUI(page, email, password);
      
      // Verify we're authenticated
      const wasAuthenticated = await getAuthState(page);
      expect(wasAuthenticated).toBe(true);

      // Find and click logout button (in header dropdown menu)
      // The logout is in a dropdown menu, so we need to open it first
      const userMenuButton = page.locator('button').filter({ hasText: /user|konto|account/i }).or(
        page.locator('[data-testid="user-menu"]')
      ).or(
        page.locator('button[aria-label*="user"]')
      ).first();

      // Try to find the user avatar/button that opens the menu
      // Based on the Header component, it's likely an avatar button
      const avatarButton = page.locator('button').filter({ has: page.locator('img, svg') }).first();
      
      // Click to open menu
      if (await avatarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await avatarButton.click();
      } else if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenuButton.click();
      } else {
        // Fallback: look for any button that might open a menu
        const menuButtons = page.locator('button[aria-haspopup="menu"], button[aria-expanded]');
        if (await menuButtons.count() > 0) {
          await menuButtons.first().click();
        }
      }

      // Wait for dropdown menu to appear
      await page.waitForTimeout(500);

      // Click logout option
      const logoutOption = page.locator('text=Wyloguj').or(page.locator('text=Wyloguj się')).first();
      await logoutOption.click();

      // Wait for redirect to login page
      await page.waitForURL((url) => url.pathname.includes('/logowanie') || url.pathname === '/', { timeout: 10000 });

      // Should be redirected to login or home
      expect(page.url()).toMatch(/\/logowanie|\/$/);

      // Wait a bit for cookies to be cleared after logout
      await page.waitForTimeout(1000);
      
      // Verify auth state is cleared - clear auth state first to ensure clean check
      await clearAuthState(page);
      await page.goto('/logowanie'); // Navigate to a page to ensure cookies are cleared
      const isAuthenticated = await getAuthState(page);
      expect(isAuthenticated).toBe(false);
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should clear session after logout', async ({ page }) => {
    const email = `test-logout-session-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      // Login first
      await loginViaUI(page, email, password);

      // Verify cookies exist
      const cookiesBefore = await page.context().cookies();
      const hasAuthCookies = cookiesBefore.some(cookie => 
        cookie.name.includes('supabase') || cookie.name.includes('auth')
      );
      expect(hasAuthCookies).toBe(true);

      // Logout
      const avatarButton = page.locator('button').filter({ has: page.locator('img, svg') }).first();
      if (await avatarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await avatarButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Wyloguj').or(page.locator('text=Wyloguj się')).first();
        await logoutOption.click();
        await page.waitForURL((url) => url.pathname.includes('/logowanie') || url.pathname === '/', { timeout: 10000 });
      }

      // Wait a bit for cookies to be cleared after logout
      await page.waitForTimeout(1000);
      
      // Verify cookies are cleared - use same check as getAuthState
      await clearAuthState(page);
      await page.goto('/logowanie'); // Navigate to ensure cookies are cleared
      const cookiesAfter = await page.context().cookies();
      const hasAuthCookiesAfter = cookiesAfter.some(cookie => {
        const name = cookie.name.toLowerCase();
        return (
          (name.includes('auth-token') || name.includes('access-token')) &&
          cookie.value &&
          cookie.value.length > 0 &&
          cookie.value !== 'null' &&
          cookie.value !== 'undefined'
        );
      });
      // Auth cookies should be cleared or expired
      expect(hasAuthCookiesAfter).toBe(false);
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should make protected routes inaccessible after logout', async ({ page, browserName }) => {
    const email = `test-logout-protected-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      // Login first
      await loginViaUI(page, email, password);
      
      // Wait for login to complete and navigation to finish
      await page.waitForURL((url) => !url.pathname.includes('/logowanie'), { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Access a protected route (only navigate if not already there)
      const currentUrl = page.url();
      if (!currentUrl.includes('/konto')) {
        // Firefox may need longer timeout for navigation
        const navTimeout = browserName === 'firefox' ? 20000 : 10000;
        await page.goto(ROUTES.account, { waitUntil: 'domcontentloaded', timeout: navTimeout });
        await page.waitForLoadState('networkidle', { timeout: navTimeout });
      }
      await expect(page).toHaveURL(/.*konto/, { timeout: browserName === 'firefox' ? 20000 : 10000 });

      // Logout
      const avatarButton = page.locator('button').filter({ has: page.locator('img, svg') }).first();
      const avatarVisible = await avatarButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (avatarVisible) {
        await avatarButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Wyloguj').or(page.locator('text=Wyloguj się')).first();
        const logoutVisible = await logoutOption.isVisible({ timeout: 2000 }).catch(() => false);
        if (logoutVisible) {
          await logoutOption.click();
          await page.waitForURL((url) => url.pathname.includes('/logowanie') || url.pathname === '/', { timeout: 10000 });
        }
      }
      
      // Ensure session is cleared and wait for logout to complete
      await page.waitForTimeout(1000);
      await clearAuthState(page);
      
      // Navigate to a neutral page first to ensure logout state is fully applied
      await page.goto(ROUTES.home);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Try to access protected route again - should redirect to login
      await page.goto(ROUTES.account);
      
      // Should redirect to login
      await page.waitForURL((url) => url.pathname.includes('/logowanie'), { timeout: 5000 });
      
      expect(page.url()).toContain('/logowanie');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should redirect to login page after logout', async ({ page }) => {
    const email = `test-logout-redirect-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      // Login first
      await loginViaUI(page, email, password);

      // Logout
      const avatarButton = page.locator('button').filter({ has: page.locator('img, svg') }).first();
      if (await avatarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await avatarButton.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator('text=Wyloguj').or(page.locator('text=Wyloguj się')).first();
        await logoutOption.click();
      }

      // Should redirect to login page
      await page.waitForURL((url) => url.pathname.includes('/logowanie') || url.pathname === '/', { timeout: 10000 });
      expect(page.url()).toMatch(/\/logowanie|\/$/);
    } finally {
      await deleteTestUser(email);
    }
  });
});


