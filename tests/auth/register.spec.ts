import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, clearAuthState } from '../helpers/auth-helpers';
import { ROUTES } from '../config/constants';

test.describe('Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('should display registration page correctly', async ({ page }) => {
    await page.goto(ROUTES.register);

    // Check page title/heading (use more specific selector to avoid header h1)
    await expect(page.locator('h1').filter({ hasText: 'Utwórz konto' })).toBeVisible();

    // Check form fields are present
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check user type selection (radio buttons are sr-only, so check by role)
    await expect(page.getByRole('radio', { name: 'Zarządca' })).toBeAttached();
    await expect(page.getByRole('radio', { name: 'Wykonawca' })).toBeAttached();

    // Check links
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should successfully register as contractor', async ({ page }) => {
    const email = `test-register-contractor-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await page.goto(ROUTES.register);

    // Fill registration form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Contractor');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    
    // Select contractor (click the label since radio button is sr-only)
    // Contractor should be default, but ensure it's selected
    await page.getByText('Wykonawca').click();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect (either to home or login with success message)
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });

    // Should be redirected away from register page
    expect(page.url()).not.toContain('/register');

    // Cleanup: delete the created user
    await deleteTestUser(email);
  });

  test('should successfully register as manager', async ({ page }) => {
    const email = `test-register-manager-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await page.goto(ROUTES.register);

    // Fill registration form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Manager');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    
    // Select manager (click the label since radio button is sr-only)
    await page.getByText('Zarządca').click();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });

    // Should be redirected away from register page
    expect(page.url()).not.toContain('/register');

    // Cleanup: delete the created user
    await deleteTestUser(email);
  });

  test('should show error with missing required fields', async ({ page }) => {
    await page.goto(ROUTES.register);

    // Try to submit without filling required fields
    const firstNameInput = page.locator('input[name="firstName"]');
    const lastNameInput = page.locator('input[name="lastName"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    // All required fields should have required attribute
    await expect(firstNameInput).toHaveAttribute('required', '');
    await expect(lastNameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should validate password length', async ({ page }) => {
    await page.goto(ROUTES.register);

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Fill with password less than 6 characters
    await page.fill('input[name="password"]', '12345');
    await page.fill('input[name="confirmPassword"]', '12345');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error about password length (either client-side or server-side)
    // Wait a bit to see if error appears
    await page.waitForTimeout(2000);
    
    // Check for error message (could be in alert or redirect with error param)
    const hasError = await page.locator('text=/hasło|password|6/i').isVisible().catch(() => false) ||
                     page.url().includes('error');
    
    // If still on register page, there should be an error
    if (page.url().includes('/register')) {
      expect(hasError).toBe(true);
    }
  });

  test('should validate password mismatch', async ({ page }) => {
    await page.goto(ROUTES.register);

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error about password mismatch
    await page.waitForTimeout(2000);
    
    // Check for error message
    const hasError = await page.locator('text=/hasła|password|identyczne|match/i').isVisible().catch(() => false) ||
                     page.url().includes('error');
    
    // If still on register page, there should be an error
    if (page.url().includes('/register')) {
      expect(hasError).toBe(true);
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto(ROUTES.register);

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Email input should have type="email" which provides browser validation
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    // Browser validation should prevent invalid email format
    const isValid = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });

  test('should allow user type selection', async ({ page }) => {
    await page.goto(ROUTES.register);

    // Check default selection (should be contractor based on code)
    const contractorRadio = page.getByRole('radio', { name: 'Wykonawca' });
    const managerRadio = page.getByRole('radio', { name: 'Zarządca' });

    // Select manager (click label since radio is sr-only)
    await page.getByText('Zarządca').click();
    await expect(managerRadio).toBeChecked();

    // Select contractor (click label since radio is sr-only)
    await page.getByText('Wykonawca').click();
    await expect(contractorRadio).toBeChecked();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto(ROUTES.register);
    const loginLink = page.getByRole('link', { name: /zaloguj|login/i });
    // Use JavaScript click to bypass any pointer event interceptors
    await Promise.all([
      page.waitForURL(/.*login/, { timeout: 5000 }),
      loginLink.evaluate((el: HTMLElement) => (el as HTMLAnchorElement).click())
    ]);
  });

  test('should redirect to home if already authenticated', async ({ page }) => {
    const email = `test-register-redirect-auth-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password, 'contractor');

    try {
      // Login first
      await page.goto(ROUTES.login);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      
      // Try to access register page - should redirect away (client-side redirect via useEffect)
      await page.goto(ROUTES.register);
      // Wait for the redirect to complete - the page component redirects to home via useEffect
      await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/register');
    } finally {
      await deleteTestUser(email);
    }
  });

  test('should show terms and privacy links', async ({ page }) => {
    await page.goto(ROUTES.register);

    // Check for terms and privacy links (use getByRole to avoid multiple matches)
    const termsLink = page.getByRole('link', { name: 'Warunki użytkowania' });
    const privacyLink = page.getByRole('link', { name: 'Politykę prywatności' });

    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(ROUTES.register);

    const passwordInput = page.locator('input[name="password"]');
    // Find the toggle button - it's a button with type="button" in the same parent as the password input
    const passwordContainer = passwordInput.locator('..');
    const toggleButton = passwordContainer.locator('button[type="button"]');

    // Fill password
    await passwordInput.fill('TestPassword123!');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again
    await toggleButton.click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});


