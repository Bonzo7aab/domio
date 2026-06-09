import { test, expect } from '@playwright/test';
import { clearAuthState, loginViaUI, seedCookieConsentAccepted } from '../helpers/auth-helpers';
import { buildContestMockData } from '../fixtures/contest-mock-data';
import {
  deleteContestTender,
  expectContestInList,
  extractContestIdFromKonkursyList,
  fillContestForm,
  publishContest,
} from '../helpers/contest-form-helpers';
import { ROUTES, SEEDED_MANAGER } from '../config/constants';

/**
 * Requires a pre-seeded manager (zarzadca3@openpro.pl) with company profile,
 * categories in DB, and R2/storage configured for document upload on publish.
 */
test.describe('Manager contest creation (zarzadca3)', () => {
  const testData: { tenderIds: string[] } = { tenderIds: [] };

  test.beforeEach(async ({ page }) => {
    await seedCookieConsentAccepted(page);
    await clearAuthState(page);
  });

  test.afterEach(async () => {
    for (const tenderId of testData.tenderIds) {
      await deleteContestTender(tenderId).catch(() => {
        // Ignore cleanup errors if tender was already removed
      });
    }
    testData.tenderIds = [];
  });

  test('should login as zarzadca3 and reach manager dashboard', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Flaky in Firefox headless environment');

    await loginViaUI(page, SEEDED_MANAGER.email, SEEDED_MANAGER.password);
    await page.goto(ROUTES.managerDashboard);

    await page.waitForURL((url) => url.pathname.startsWith('/panel-zarzadcy'), {
      timeout: 15000,
    });

    expect(page.url()).not.toContain('/logowanie');
    await expect(page.getByText(/nieruchomości|aktywne zgłoszenia|panel/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('should publish a contest with mock data', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Flaky in Firefox headless environment');
    test.setTimeout(120000);

    const mockData = buildContestMockData();

    await loginViaUI(page, SEEDED_MANAGER.email, SEEDED_MANAGER.password);
    await page.goto(ROUTES.postContest);

    await fillContestForm(page, mockData);
    await publishContest(page);

    await expectContestInList(page, mockData.title);

    const tenderId = await extractContestIdFromKonkursyList(page, mockData.title);
    if (tenderId) {
      testData.tenderIds.push(tenderId);
    }
  });
});
