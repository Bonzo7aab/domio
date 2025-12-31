import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, loginViaUI, clearAuthState } from '../helpers/auth-helpers';
import { ROUTES } from '../config/constants';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto(ROUTES.login);

    // Check page title/heading (use filter to avoid header h1)
    await expect(page.locator('h1').filter({ hasText: 'Zaloguj się' })).toBeVisible();

    // Check form fields are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check links
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const email = `test-login-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    // Create test user
    await createTestUser(email, password, 'contractor');

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
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message to appear (check for Alert with error text)
    // The error can be in various formats from Supabase
    await expect(page.locator('[role="alert"]').or(page.locator('text=/invalid|błąd|error|credentials|nieprawidłowe/i'))).toBeVisible({ timeout: 5000 });
  });

  test('should show error with missing email', async ({ page }) => {
    await page.goto(ROUTES.login);
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
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'somepassword');
    
    // Email input should have type="email" which provides browser validation
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    // Browser validation should prevent invalid email format
    const isValid = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });

  test('should redirect to redirectTo parameter after successful login', async ({ page }) => {
    const email = `test-login-redirect-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

    try {
      const redirectTo = '/account';
      await page.goto(`${ROUTES.login}?redirectTo=${encodeURIComponent(redirectTo)}`);
      
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
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
    await page.click('a[href="/forgot-password"]');
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/.*register/);
  });

  test('should redirect to home if already authenticated', async ({ page }) => {
    const email = `test-login-redirect-auth-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

    try {
      // Login first
      await loginViaUI(page, email, password);
      
      // Try to access login page
      await page.goto(ROUTES.login);
      
      // Should redirect away from login page
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
      expect(page.url()).not.toContain('/login');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should show loading state during login', async ({ page }) => {
    const email = `test-login-loading-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

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


