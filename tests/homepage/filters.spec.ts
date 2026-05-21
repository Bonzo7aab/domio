import { test, expect } from '@playwright/test';

test.describe('Homepage filters (KAN-6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows dual search in header on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByLabel('Czego szukasz?')).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: /Wszystkie dzielnice|Lokalizacja/ }).first()).toBeVisible();
  });

  test('sort control has Sortuj label and budget options without applications', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByText('Sortuj:', { exact: true })).toBeVisible();
    const sortTrigger = page.locator('[role="combobox"]').filter({ has: page.locator('svg') }).last();
    await sortTrigger.click();
    await expect(page.getByRole('option', { name: 'Od najnowszych' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Budżet malejąco' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Budżet rosnąco' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Bliski termin' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Daleki termin' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Najwięcej aplikacji' })).toHaveCount(0);
  });

  test('sidebar omits removed filter sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByText('Typ Ogłoszenia')).toHaveCount(0);
    await expect(page.getByText('Aktywne filtry').first()).not.toBeVisible();
    await expect(page.getByText('Termin realizacji')).toBeVisible();
    await expect(page.getByText('Typ Klienta')).toHaveCount(0);
  });

  test('map toggle is present on list toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByText('Zobacz mapę')).toBeVisible();
    await expect(page.locator('#map-toggle')).toBeVisible();
  });
});
