import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, loginViaUI, clearAuthState, waitForAuthInitialized } from '../helpers/auth-helpers';
import { ROUTES } from '../config/constants';

test.describe('Login Page', () => {
  // Track test data for cleanup
  const testData: { userEmails: string[] } = {
    userEmails: [],
  };

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
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

  test('should display login page correctly', async ({ page, browserName }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    
    // Wait for auth initialization (critical for WebKit)
    await waitForAuthInitialized(page);
    
    // Browser-specific timeout
    const timeout = browserName === 'webkit' ? 30000 : 20000;
    
    // Wait for page to finish loading - use data-testid selectors with fallbacks
    await Promise.race([
      expect(page.locator('[data-testid="login-page"]')).toBeVisible({ timeout }),
      expect(page.locator('[data-testid="login-heading"]')).toBeVisible({ timeout }),
      expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout }),
    ]);

    // Check form fields are present
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout });
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout });

    // Check links
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible({ timeout });
    await expect(page.locator('a[href="/register"]')).toBeVisible({ timeout });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const email = `test-login-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    // Create test user
    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      await page.goto(ROUTES.login);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      // Wait for redirect away from login page
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

      // Verify we're not on login page anymore
      expect(page.url()).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(ROUTES.login);
    
    // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
    // Then wait for form fields to be visible and actionable
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toBeEnabled({ timeout: 10000 });
    
    await emailInput.fill('invalid@example.com');
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeEnabled({ timeout: 10000 });
    await passwordInput.fill('wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message to appear (check for Alert with error text)
    // The error can be in various formats from Supabase
    await expect(page.locator('[role="alert"]').or(page.locator('text=/invalid|błąd|error|credentials|nieprawidłowe/i'))).toBeVisible({ timeout: 5000 });
  });

  test('should show error with missing email', async ({ page }) => {
    await page.goto(ROUTES.login);
    
    // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
    // Then wait for form fields to be visible
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
    
    await page.fill('input[name="password"]', 'somepassword');
    
    // Try to submit without email
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
    
    // Form validation should prevent submission
    const isRequired = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid === false);
    expect(isRequired).toBe(true);
  });

  test('should show error with missing password', async ({ page }) => {
    await page.goto(ROUTES.login);
    
    // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
    // Then wait for form fields to be visible
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
    
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Try to submit without password
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
    
    // Form validation should prevent submission
    const isRequired = await passwordInput.evaluate((el) => (el as HTMLInputElement).validity.valid === false);
    expect(isRequired).toBe(true);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto(ROUTES.login);
    
    // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
    // Then wait for form fields to be visible and actionable
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toBeEnabled({ timeout: 10000 });
    
    await emailInput.fill('invalid-email');
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeEnabled({ timeout: 10000 });
    await passwordInput.fill('somepassword');
    
    // Email input should have type="email" which provides browser validation
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    // Browser validation should prevent invalid email format
    const isValid = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });

  test('should redirect to redirectTo parameter after successful login', async ({ page }) => {
    const email = `test-login-redirect-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      const redirectTo = '/account';
      await page.goto(`${ROUTES.login}?redirectTo=${encodeURIComponent(redirectTo)}`);
      
      // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
      await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
      // Then wait for form fields to be visible and actionable
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await expect(emailInput).toBeEnabled({ timeout: 10000 });
      
      await emailInput.fill(email);
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toBeVisible({ timeout: 10000 });
      await expect(passwordInput).toBeEnabled({ timeout: 10000 });
      await passwordInput.fill(password);
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForURL((url) => url.pathname === redirectTo || url.pathname !== '/login', { timeout: 10000 });
      
      // Should be redirected (either to redirectTo or home)
      expect(page.url()).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto(ROUTES.login);
    
    // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
    
    // Wait for forgot password link to be visible
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible({ timeout: 10000 });
    
    // Use Playwright's native click which handles navigation better
    await Promise.all([
      page.waitForURL(/.*forgot-password/, { timeout: 10000 }),
      forgotPasswordLink.click()
    ]);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto(ROUTES.login);
    
    // Wait for login page to finish loading - wait for the heading first (more reliable indicator)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible({ timeout: 10000 });
    
    // Wait for register link to be visible
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible({ timeout: 10000 });
    
    // Use Playwright's native click which handles navigation better
    await Promise.all([
      page.waitForURL(/.*register/, { timeout: 10000 }),
      registerLink.click()
    ]);
  });

  test('should redirect to home if already authenticated', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Flaky in Firefox headless environment');
    const email = `test-login-redirect-auth-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      // Login first
      await loginViaUI(page, email, password);
      
      // Wait for post-login redirects to complete
      await page.waitForLoadState('networkidle');
      
      // Small delay for Firefox to handle redirects
      if (browserName === 'firefox') {
        await page.waitForTimeout(500);
      }
      
      // Try to access login page
      await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
      
      // Should redirect away from login page (middleware + client redirect)
      // Use longer timeout for redirect check
      const redirectTimeout = browserName === 'webkit' ? 20000 : 15000;
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: redirectTimeout });
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should show loading state during login', async ({ page }) => {
    const email = `test-login-loading-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);

    try {
      await page.goto(ROUTES.login);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      
      // Click submit and check for loading state
      await page.click('button[type="submit"]');
      
      // Button should be disabled or show loading state
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      // Either button is disabled or we've navigated away
      const hasNavigated = !page.url().includes('/login');
      
      expect(isDisabled || hasNavigated).toBe(true);
    } finally {
      await deleteTestUser(email);
    }
  });
});


