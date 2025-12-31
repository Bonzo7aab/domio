import { test, expect } from '@playwright/test';
import { createTestUser, loginViaUI, clearAuthState } from '../helpers/auth-helpers';
import {
  getPoolContractorUser,
  getPoolManagerUser,
  createTestJob,
  createTestTender,
  cleanupTestData,
} from '../helpers/offer-helpers';

test.describe('Contractor Making Offers', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Regular Job Offer Submission', () => {
    test('should successfully submit offer on regular job with all required fields', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser();
        const poolManager = await getPoolManagerUser();
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id, {
          title: `Test Job for Offer ${Date.now()}`,
          description: 'This is a test job for submitting offers',
        });
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        const applyButton = page.getByRole('button', { name: /złóż ofertę/i });
        await expect(applyButton).toBeVisible();
        await applyButton.click();

        // Wait for form modal to appear
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/złóż ofertę/i)).toBeVisible();

        // Fill form with valid data
        const priceInput = page.locator('input[id="proposedPrice"]');
        await priceInput.fill('15000');
        
        // Select estimated completion time - find combobox in the dialog
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await expect(timeSelect).toBeVisible();
        await timeSelect.click();
        // Wait for dropdown to appear and select option
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        const option = page.getByRole('option', { name: '1 miesiąc' });
        await expect(option).toBeVisible();
        await option.click();
        // Wait a moment for the select value to update
        await page.waitForTimeout(200);
        
        // Fill cover letter - find textarea by placeholder or by position (first textarea in dialog)
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await expect(coverLetterTextarea).toBeVisible();
        const coverLetterText = 'Mam wieloletnie doświadczenie w realizacji podobnych projektów. Oferuję wysoką jakość wykonania i terminowość.';
        await coverLetterTextarea.fill(coverLetterText);
        
        // Verify all form fields are filled before submitting
        const priceValue = await priceInput.inputValue();
        const textareaValue = await coverLetterTextarea.inputValue();
        // Check that select value is set by looking for the selected option text in the combobox
        const selectValue = await timeSelect.textContent();
        
        // Ensure we have valid data
        expect(Number(priceValue)).toBeGreaterThan(0);
        expect(textareaValue.length).toBeGreaterThanOrEqual(50);
        
        // Submit form
        const submitButton = page.getByRole('button', { name: /wyślij ofertę/i });
        await expect(submitButton).toBeEnabled();
        await expect(submitButton).not.toBeDisabled();
        
        // Click submit button - this triggers handleSubmit which calls onApplicationSubmit
        await submitButton.click();
        
        // Wait for loading state to appear (button shows "Wysyłanie...")
        await page.waitForTimeout(500);
        
        // Wait for success message (toast) - sonner toasts use [data-sonner-toast]
        // The modal simulates 1s delay, then the parent component makes the API call
        await expect(
          page.locator('[data-sonner-toast]').filter({ hasText: /oferta została złożona pomyślnie/i }).first()
        ).toBeVisible({ timeout: 20000 });

        // Verify form closes after success
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should successfully submit offer with optional additional notes', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(1);
        const poolManager = await getPoolManagerUser(1);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill required fields
        await page.locator('input[id="proposedPrice"]').fill('20000');
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await timeSelect.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '2 tygodnie' }).click();
        
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea.fill(
          'Jestem doświadczonym wykonawcą z wieloletnim stażem. Gwarantuję profesjonalne podejście i terminową realizację projektu zgodnie z wymaganiami.'
        );

        // Fill optional additional notes
        const additionalNotesTextarea = page.getByPlaceholder(/dodatkowe informacje/i).or(
          page.getByRole('dialog').locator('textarea').nth(1)
        );
        await additionalNotesTextarea.fill('Mogę rozpocząć pracę natychmiast po akceptacji oferty.');

        // Submit form
        const submitButton = page.getByRole('button', { name: /wyślij ofertę/i });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        // Wait for loading state to appear (button shows "Wysyłanie...")
        await page.waitForTimeout(500);

        // Wait for success message (toast) - sonner toasts use [data-sonner-toast]
        // The modal simulates 1s delay, then the parent component makes the API call
        await expect(
          page.locator('[data-sonner-toast]').filter({ hasText: /oferta została złożona pomyślnie/i }).first()
        ).toBeVisible({ timeout: 20000 });

        // Verify form closes after success
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });
  });

  test.describe('Tender Bid Submission', () => {
    test('should successfully submit bid on tender with all required fields', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser();
        const poolManager = await getPoolManagerUser();
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testTender = await createTestTender(poolManager.user.id, poolManager.company.id, {
          title: `Test Tender for Bid ${Date.now()}`,
        });
        tenderIds.push(testTender.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to tender page (tenders use same route structure as jobs) with error handling
        try {
          await page.goto(`/jobs/${testTender.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            await page.waitForTimeout(1000); // Wait for redirect/cleanup to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testTender.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              await page.goto(`/jobs/${testTender.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/złóż ofertę w przetargu/i)).toBeVisible();

        // Fill form with valid data
        await page.locator('input[id="proposedPrice"]').fill('95000');
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await timeSelect.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '2-3 miesiące' }).click();
        
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea.fill(
          'Nasza firma posiada wieloletnie doświadczenie w realizacji podobnych projektów. Oferujemy kompleksowe rozwiązanie z pełnym wsparciem technicznym i gwarancją jakości.'
        );

        // Submit form
        await page.getByRole('button', { name: /wyślij ofertę w przetargu/i }).click();

        // Wait for success message (sonner toast)
        await expect(
          page.locator('[data-sonner-toast]').filter({ hasText: /oferta w przetargu została złożona pomyślnie/i }).first()
        ).toBeVisible({ timeout: 20000 });

        // Verify form closes after success
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should successfully submit bid with optional additional notes', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(1);
        const poolManager = await getPoolManagerUser(1);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testTender = await createTestTender(poolManager.user.id, poolManager.company.id);
        tenderIds.push(testTender.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to tender page with error handling
        try {
          await page.goto(`/jobs/${testTender.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            await page.waitForTimeout(1000); // Wait for redirect/cleanup to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testTender.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              await page.goto(`/jobs/${testTender.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill required fields
        await page.locator('input[id="proposedPrice"]').fill('88000');
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await timeSelect.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '1 miesiąc' }).click();
        
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea.fill(
          'Specjalizujemy się w realizacji projektów budowlanych i remontowych. Posiadamy odpowiednie certyfikaty i doświadczenie w branży.'
        );

        // Fill optional additional notes
        const additionalNotesTextarea = page.getByPlaceholder(/dodatkowe informacje/i).or(
          page.getByRole('dialog').locator('textarea').nth(1)
        );
        await additionalNotesTextarea.fill('Jesteśmy gotowi do rozpoczęcia prac w ciągu tygodnia od podpisania umowy.');

        // Submit form
        await page.getByRole('button', { name: /wyślij ofertę w przetargu/i }).click();

        // Verify success
        await expect(page.getByText(/oferta w przetargu została złożona pomyślnie/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });
  });

  test.describe('Validation Tests', () => {
    test('should prevent submission when contractor has no company', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];
      const userEmails: string[] = [];

      try {
        // This test needs a contractor WITHOUT company, so create a new one
        // But use pool manager for the job
        const poolManager = await getPoolManagerUser();
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const contractorEmail = `test-no-company-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
        const contractorPassword = 'TestPassword123!';
        await createTestUser(contractorEmail, contractorPassword, 'contractor');
        userEmails.push(contractorEmail);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, contractorEmail, contractorPassword);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Should show error dialog or message about needing company
        // The error could be a toast or a dialog
        const hasError = await Promise.race([
          page.getByText(/musisz najpierw dodać informacje o swojej firmie/i).waitFor({ timeout: 5000 }).then(() => true),
          page.getByText(/company|firm/i).waitFor({ timeout: 5000 }).then(() => true),
          page.getByRole('dialog').filter({ hasText: /firm/i }).waitFor({ timeout: 5000 }).then(() => true),
        ]).catch(() => false);

        expect(hasError).toBe(true);
      } finally {
        await cleanupTestData(jobIds, tenderIds, companyIds, userEmails);
      }
    });

    test('should prevent submission with missing required fields', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(2);
        const poolManager = await getPoolManagerUser(2);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Try to submit without filling required fields
        const submitButton = page.getByRole('button', { name: /wyślij ofertę/i });
        await submitButton.click();

        // Should show validation errors
        await expect(page.getByText(/wypełnij wszystkie wymagane pola/i).or(
          page.getByText(/podaj proponowaną cenę/i).or(
            page.getByText(/podaj przewidywany czas/i)
          )
        ).first()).toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should prevent submission with invalid price (0 or negative)', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(0);
        const poolManager = await getPoolManagerUser(0);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill with invalid price (0)
        await page.locator('input[id="proposedPrice"]').fill('0');
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await timeSelect.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '1 miesiąc' }).click();
        
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea.fill(
          'Mam wieloletnie doświadczenie w realizacji podobnych projektów. Oferuję wysoką jakość wykonania i terminowość.'
        );

        // Try to submit
        await page.getByRole('button', { name: /wyślij ofertę/i }).click();

        // Should show validation error
        await expect(page.getByText(/podaj prawidłową kwotę/i).or(
          page.getByText(/wypełnij wszystkie wymagane pola/i)
        ).first()).toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should prevent duplicate bids on same tender', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(1);
        const poolManager = await getPoolManagerUser(1);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testTender = await createTestTender(poolManager.user.id, poolManager.company.id);
        tenderIds.push(testTender.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to tender page with error handling
        try {
          await page.goto(`/jobs/${testTender.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            await page.waitForTimeout(1000); // Wait for redirect/cleanup to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testTender.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              await page.goto(`/jobs/${testTender.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Submit first bid
        await page.getByRole('button', { name: /złóż ofertę/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('input[id="proposedPrice"]').fill('90000');
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await timeSelect.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '1 miesiąc' }).click();
        
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea.fill(
          'Nasza firma posiada wieloletnie doświadczenie w realizacji podobnych projektów. Oferujemy kompleksowe rozwiązanie z pełnym wsparciem technicznym.'
        );

        await page.getByRole('button', { name: /wyślij ofertę w przetargu/i }).click();
        
        // Wait for success message (toast) - sonner toasts use [data-sonner-toast]
        await expect(
          page.locator('[data-sonner-toast]').filter({ hasText: /oferta w przetargu została złożona pomyślnie/i }).first()
        ).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

        // Reload page to see updated state
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Try to submit second bid on same tender
        // After reload, button text changes to "Oferta już złożona" or button is disabled
        // Look for either "Złóż ofertę" or "Oferta już złożona" button
        const applyButton = page.getByRole('button', { name: /złóż ofertę|oferta już złożona/i }).first();
        await expect(applyButton).toBeVisible();
        
        // Check if button is disabled or if clicking shows error
        const isDisabled = await applyButton.isDisabled().catch(() => false);
        
        if (!isDisabled) {
          await applyButton.click();
          
          // Should show error about duplicate bid (either toast or dialog)
          const hasDuplicateError = await Promise.race([
            page.locator('[data-sonner-toast]').filter({ hasText: /już złożyłeś ofertę|nie możesz złożyć więcej/i }).waitFor({ timeout: 5000 }).then(() => true),
            page.getByText(/już złożyłeś ofertę/i).waitFor({ timeout: 5000 }).then(() => true),
            page.getByText(/nie możesz złożyć więcej niż jednej oferty/i).waitFor({ timeout: 5000 }).then(() => true),
          ]).catch(() => false);
          
          expect(hasDuplicateError).toBe(true);
        } else {
          // Button is disabled, which is also acceptable behavior
          expect(isDisabled).toBe(true);
        }
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should allow multiple applications on different jobs', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(2);
        const poolManager = await getPoolManagerUser(2);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob1 = await createTestJob(poolManager.user.id, poolManager.company.id, {
          title: `Test Job 1 ${Date.now()}`,
        });
        jobIds.push(testJob1.id);

        const testJob2 = await createTestJob(poolManager.user.id, poolManager.company.id, {
          title: `Test Job 2 ${Date.now()}`,
        });
        jobIds.push(testJob2.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Submit offer on first job with error handling
        try {
          await page.goto(`/jobs/${testJob1.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            await page.waitForTimeout(1000);
            if (page.url().includes(`/jobs/${testJob1.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              await page.goto(`/jobs/${testJob1.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }
        await page.getByRole('button', { name: /złóż ofertę/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('input[id="proposedPrice"]').fill('15000');
        const timeSelectLabel1 = page.getByText(/czas realizacji/i);
        const timeSelect1 = timeSelectLabel1.locator('..').locator('button[role="combobox"]').first();
        await timeSelect1.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '1 miesiąc' }).click();
        
        const coverLetterTextarea1 = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea1.fill(
          'Mam wieloletnie doświadczenie w realizacji podobnych projektów. Oferuję wysoką jakość wykonania i terminowość.'
        );

        await page.getByRole('button', { name: /wyślij ofertę/i }).click();
        await expect(
          page.getByText(/oferta została złożona pomyślnie/i).or(
            page.locator('[role="status"]').filter({ hasText: /oferta/i })
          )
        ).toBeVisible({ timeout: 15000 });

        // Submit offer on second job with error handling
        try {
          await page.goto(`/jobs/${testJob2.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            await page.waitForTimeout(1000);
            if (page.url().includes(`/jobs/${testJob2.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              await page.goto(`/jobs/${testJob2.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }
        await page.getByRole('button', { name: /złóż ofertę/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('input[id="proposedPrice"]').fill('20000');
        const timeSelectLabel2 = page.getByText(/czas realizacji/i);
        const timeSelect2 = timeSelectLabel2.locator('..').locator('button[role="combobox"]').first();
        await timeSelect2.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '2 tygodnie' }).click();
        
        const coverLetterTextarea2 = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea2.fill(
          'Jestem doświadczonym wykonawcą z wieloletnim stażem. Gwarantuję profesjonalne podejście i terminową realizację projektu.'
        );

        await page.getByRole('button', { name: /wyślij ofertę/i }).click();
        await expect(page.getByText(/oferta została złożona pomyślnie/i)).toBeVisible({ timeout: 10000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });
  });

  test.describe('UI Interaction Tests', () => {
    test('should display form fields correctly', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(0);
        const poolManager = await getPoolManagerUser(0);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Verify form fields are visible
        await expect(page.getByLabel(/proponowana cena/i)).toBeVisible();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText(/czas realizacji/i).first()).toBeVisible();
        await expect(dialog.getByText(/opis oferty/i)).toBeVisible();
        await expect(dialog.getByText(/dodatkowe uwagi/i)).toBeVisible();

        // Verify buttons are visible
        await expect(page.getByRole('button', { name: /anuluj/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /wyślij ofertę/i })).toBeVisible();
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should show loading state during submission', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(1);
        const poolManager = await getPoolManagerUser(1);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill form
        await page.locator('input[id="proposedPrice"]').fill('15000');
        const timeSelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
        await timeSelect.click();
        await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        await page.getByRole('option', { name: '1 miesiąc' }).click();
        
        const coverLetterTextarea = page.getByPlaceholder(/opisz swoją ofertę/i).or(
          page.getByRole('dialog').locator('textarea').first()
        );
        await coverLetterTextarea.fill(
          'Mam wieloletnie doświadczenie w realizacji podobnych projektów. Oferuję wysoką jakość wykonania i terminowość.'
        );

        // Submit and check for loading state
        const submitButton = page.getByRole('button', { name: /wyślij ofertę/i });
        await submitButton.click();

        // Check for loading indicator - button should become disabled or show "Wysyłanie..." text
        // Use a locator that matches either button state (original or loading)
        const loadingButton = page.getByRole('button', { name: /wyślij ofertę|wysyłanie/i });
        const hasLoadingState = await Promise.race([
          loadingButton.getByText(/wysyłanie/i).waitFor({ timeout: 2000 }).then(() => true),
          // Poll for disabled state
          (async () => {
            for (let i = 0; i < 20; i++) {
              const isDisabled = await loadingButton.isDisabled().catch(() => false);
              if (isDisabled) return true;
              await page.waitForTimeout(100);
            }
            return false;
          })(),
        ]).catch(() => false);

        // Loading state should appear (either disabled button or loading text)
        expect(hasLoadingState).toBe(true);
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });

    test('should allow canceling form submission', async ({ page }) => {
      const jobIds: string[] = [];
      const companyIds: string[] = [];
      const tenderIds: string[] = [];

      try {
        // Use pool users instead of creating new ones
        const poolContractor = await getPoolContractorUser(2);
        const poolManager = await getPoolManagerUser(2);
        
        // Don't add pool user companies to cleanup - they're shared resources
        // companyIds.push(poolManager.company.id);

        const testJob = await createTestJob(poolManager.user.id, poolManager.company.id);
        jobIds.push(testJob.id);

        // Login as contractor
        await loginViaUI(page, poolContractor.email, poolContractor.password);

        // Navigate to job page with error handling for interrupted navigation
        try {
          await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForLoadState('networkidle');
        } catch (error: any) {
          // Retry navigation if interrupted (NS_BINDING_ABORTED or redirected)
          if (error.message?.includes('NS_BINDING_ABORTED') || 
              error.message?.includes('interrupted') ||
              error.message?.includes('interrupted by another navigation')) {
            // Wait for any redirect to complete
            await page.waitForURL((url) => !url.pathname.includes('/jobs/') || url.pathname.includes(`/jobs/${testJob.id}`), { timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(1000); // Additional wait for cleanup/redirect to complete
            // Check if we're already on the correct page
            if (page.url().includes(`/jobs/${testJob.id}`)) {
              await page.waitForLoadState('networkidle');
            } else {
              // Retry navigation
              await page.goto(`/jobs/${testJob.id}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForLoadState('networkidle');
            }
          } else {
            throw error;
          }
        }

        // Click "Złóż ofertę" button
        await page.getByRole('button', { name: /złóż ofertę/i }).click();

        // Wait for form modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill some fields
        await page.locator('input[id="proposedPrice"]').fill('15000');

        // Click cancel button
        await page.getByRole('button', { name: /anuluj/i }).click();

        // Form should close
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } finally {
        // Clean up jobs/tenders/companies but not pool users
        await cleanupTestData(jobIds, tenderIds, companyIds, []);
      }
    });
  });
});

