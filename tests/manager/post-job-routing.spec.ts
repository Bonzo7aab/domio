import { test, expect } from '@playwright/test';

test.describe('Post job (KAN-9)', () => {
  test('unauthenticated user is redirected to login from /dodaj-zlecenie', async ({ page }) => {
    await page.goto('/dodaj-zlecenie');
    await expect(page).toHaveURL(/\/logowanie/);
  });
});
