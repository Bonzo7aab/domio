import { test, expect } from '@playwright/test';

test.describe('Post job (KAN-9)', () => {
  test('unauthenticated user is redirected to login from /dodaj-konkurs', async ({ page }) => {
    await page.goto('/dodaj-konkurs');
    await expect(page).toHaveURL(/\/logowanie/);
  });
});
