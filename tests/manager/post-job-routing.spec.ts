import { test, expect } from '@playwright/test';

test.describe('Post job (KAN-9)', () => {
  test('unauthenticated user is redirected to login from /post-job', async ({ page }) => {
    await page.goto('/post-job');
    await expect(page).toHaveURL(/\/login/);
  });
});
