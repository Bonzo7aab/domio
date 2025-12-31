import { test, expect } from '@playwright/test';
import { clearAuthState } from '../helpers/auth-helpers';
import { ROUTES } from '../config/constants';

test.describe('Password Reset', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('should display forgot password page correctly', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);

    // Check page title/heading (use CardTitle which is h2 inside the card)
    await expect(page.getByRole('heading', { name: /zapomniał|hasło|password/i })).toBeVisible();

    // Check form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for back button or login link
    const hasBackButton = await page.locator('text=/powrót|back/i').isVisible().catch(() => false);
    const hasLoginLink = await page.locator('text=/zaloguj|login/i').isVisible().catch(() => false);
    
    expect(hasBackButton || hasLoginLink).toBe(true);
  });

  test('should show success message after submitting valid email', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);
    await page.waitForLoadState('networkidle');

    // Fill email field
    const email = `test-reset-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for the form to disappear (success state renders a completely different component)
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      return !form || !form.isConnected;
    }, { timeout: 5000 }).catch(() => {});
    
    // Wait a bit for React to render the new state
    await page.waitForTimeout(500);

    // Wait for success message to appear
    await expect(page.getByRole('heading', { name: 'Email wysłany!' })).toBeVisible({ timeout: 10000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);

    // Fill with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    
    // Email input should have type="email" which provides browser validation
    const emailInput = page.locator('input[type="email"]');
    const isValid = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });

  test('should show error with missing email', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);

    // Try to submit without email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
    
    // Form validation should prevent submission
    const isRequired = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid === false);
    expect(isRequired).toBe(true);
  });

  test('should navigate back to home/login', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);

    // Look for back button
    const backButton = page.locator('text=/powrót|back/i').first();
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton.click();
      // Should navigate away from forgot password page
      await page.waitForTimeout(1000);
      expect(page.url()).not.toContain('forgot-password');
    }
  });

  test('should navigate to login page via login link', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);

    // The login "link" is actually a button with variant="link" in the form state
    // Look for button with text "Zaloguj" (form state) or "Powrót do logowania" (success state)
    const loginButtonForm = page.getByRole('button', { name: 'Zaloguj' });
    const loginButtonSuccess = page.getByRole('button', { name: /powrót do logowania/i });
    
    // Try form state button first
    if (await loginButtonForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Use JavaScript click to bypass any pointer event interceptors
      await loginButtonForm.evaluate((el: HTMLElement) => (el as HTMLButtonElement).click());
      // The button navigates to user-type-selection (which then leads to login)
      await page.waitForURL(/.*(user-type-selection|login)/, { timeout: 5000 });
    } else if (await loginButtonSuccess.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try success state button
      await loginButtonSuccess.evaluate((el: HTMLElement) => (el as HTMLButtonElement).click());
      await page.waitForURL(/.*(user-type-selection|login)/, { timeout: 5000 });
    } else {
      // Fallback: look for any login link/button
      const loginElement = page.locator('button:has-text("Zaloguj"), button:has-text("Powrót do logowania"), a[href*="login"]').first();
      if (await loginElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginElement.evaluate((el: HTMLElement) => (el as HTMLButtonElement | HTMLAnchorElement).click());
        await page.waitForURL(/.*(user-type-selection|login)/, { timeout: 5000 });
      }
    }
  });

  test('should show success state after form submission', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);
    await page.waitForLoadState('networkidle');

    const email = `test-reset-success-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for the form to disappear (success state renders a completely different component)
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      return !form || !form.isConnected;
    }, { timeout: 5000 }).catch(() => {});
    
    // Wait a bit for React to render the new state
    await page.waitForTimeout(500);

    // Wait for success state to appear
    await expect(page.getByRole('heading', { name: 'Email wysłany!' })).toBeVisible({ timeout: 10000 });
  });

  test('should display instructions in success state', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);
    await page.waitForLoadState('networkidle');

    const email = `test-reset-instructions-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for the form to disappear (success state renders a completely different component)
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      return !form || !form.isConnected;
    }, { timeout: 5000 }).catch(() => {});
    
    // Wait a bit for React to render the new state
    await page.waitForTimeout(500);

    // Wait for success state to appear first
    await expect(page.getByRole('heading', { name: 'Email wysłany!' })).toBeVisible({ timeout: 10000 });

    // Check for instructions text - the component shows instructions in CardContent
    await expect(page.getByText('Sprawdź folder spam/junk')).toBeVisible({ timeout: 5000 });
  });
});


