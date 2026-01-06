# Playwright E2E Tests

This directory contains end-to-end tests for the Domio application using Playwright.

## Setup

### Option 1: Local Supabase (Recommended) ⭐

**Best for:** Development, testing, complete isolation from production

1. **Install Docker Desktop** (if not already installed)
   - macOS: https://docs.docker.com/desktop/install/mac-install/
   - Or: `brew install --cask docker`

2. **Set up local Supabase:**
   ```bash
   npm run supabase:setup
   ```

3. **Apply database migrations:**
   ```bash
   npm run supabase:migrate-local
   ```

4. **Configure environment variables:**
   - Copy `tests/env.local.example.txt` to `.env.test.local`
   - Get connection details: `npm run supabase:start`
   - Copy the API URL, anon key, and service_role key to `.env.test.local`

5. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

**See [supabase/README.md](../supabase/README.md) for detailed local Supabase documentation.**

### Option 2: Cloud Test Project

**Best for:** CI/CD, when Docker is not available

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Configure environment variables:**
   - Copy `tests/env.example.txt` to `.env.test.local`
   - Fill in your **test** Supabase project credentials (NOT production!):
     - `NEXT_PUBLIC_SUPABASE_URL` - Your test Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your test project publishable key
     - `SUPABASE_SERVICE_ROLE_KEY` - Your test project service role key

## Running Tests

### Run all tests
```bash
# With local Supabase (automatically starts if needed)
npm run test:e2e:local

# Or manually start Supabase first
npm run supabase:start
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test tests/auth/login.spec.ts
```

### Run tests in a specific browser
```bash
npx playwright test --project=chromium
```

## Test Structure

```
tests/
├── auth/                    # Authentication test suites
│   ├── login.spec.ts       # Login page tests
│   ├── register.spec.ts    # Registration tests
│   ├── logout.spec.ts      # Logout functionality tests
│   ├── password-reset.spec.ts  # Password reset tests
│   ├── route-protection.spec.ts # Protected route tests
│   └── auth-flow.spec.ts   # End-to-end auth flow tests
├── config/
│   └── constants.ts        # Test constants and configuration
├── fixtures/
│   └── auth-fixtures.ts    # Playwright fixtures for authenticated pages
├── helpers/
│   └── auth-helpers.ts     # Helper functions for auth operations
├── setup/
│   ├── global-setup.ts     # Global test setup
│   └── global-teardown.ts  # Global test teardown
└── README.md               # This file
```

## Test Data Management

Tests use the Supabase admin API to create and clean up test users. All test users are created with email addresses prefixed with `test-playwright-` to make them easily identifiable.

### Test Isolation Best Practices

**IMPORTANT**: For reliable tests, always create unique test data per test. This prevents race conditions and cross-test interference.

#### ✅ Recommended: Use Unique Users Per Test

```typescript
import { createUniqueTestUsers } from '../helpers/offer-helpers';

test('my test', async ({ page }) => {
  // Create unique users for this test
  const { contractor, manager } = await createUniqueTestUsers();
  
  // Use contractor.email, contractor.password, contractor.user.id, contractor.company.id
  // Use manager.email, manager.password, manager.user.id, manager.company.id
  
  // Test code here...
  
  // Cleanup is handled automatically by afterEach hook
});
```

#### ❌ Deprecated: Pool Users (Avoid)

Pool users (`getPoolContractorUser()`, `getPoolManagerUser()`) are deprecated and can cause race conditions in parallel tests. They're kept for backward compatibility only.

### Automatic Cleanup

- **afterEach hooks**: All test files have `afterEach` hooks that automatically clean up test data
- **finally blocks**: Tests also clean up in `finally` blocks as a backup
- **Global teardown**: Runs after all tests to clean up any remaining test users

### Manual Cleanup

If tests fail and leave test users behind, you can manually clean them up:

```typescript
import { cleanupTestUsers } from './helpers/auth-helpers';

// Clean up all test users
await cleanupTestUsers();
```

## Writing Tests

### Using Fixtures

Use the provided fixtures for authenticated test contexts:

```typescript
import { test, expect } from './fixtures/auth-fixtures';

test('my test', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/account');
  // ...
});
```

### Creating Test Users

#### For Simple Tests (Single User)

```typescript
import { createTestUser, deleteTestUser } from '../helpers/auth-helpers';

test.describe('My Tests', () => {
  const testData: { userEmails: string[] } = { userEmails: [] };

  test.beforeEach(() => {
    testData.userEmails = [];
  });

  test.afterEach(async () => {
    for (const email of testData.userEmails) {
      await deleteTestUser(email).catch(() => {});
    }
  });

  test('my test', async ({ page }) => {
    const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const password = 'TestPassword123!';
    
    await createTestUser(email, password, 'contractor');
    testData.userEmails.push(email);
    
    // Your test code here
    // Cleanup happens automatically in afterEach
  });
});
```

#### For Tests Requiring Multiple Users (Contractor + Manager)

```typescript
import { createUniqueTestUsers, cleanupTestData } from '../helpers/offer-helpers';

test.describe('My Tests', () => {
  const testData = {
    jobIds: [],
    tenderIds: [],
    companyIds: [],
    userEmails: [],
  };

  test.afterEach(async () => {
    await cleanupTestData(
      testData.jobIds,
      testData.tenderIds,
      testData.companyIds,
      testData.userEmails
    );
    // Reset arrays
    Object.keys(testData).forEach(key => {
      testData[key as keyof typeof testData] = [];
    });
  });

  test('my test', async ({ page }) => {
    const { contractor, manager } = await createUniqueTestUsers();
    testData.userEmails.push(contractor.email, manager.email);
    testData.companyIds.push(contractor.company.id, manager.company.id);
    
    // Create test job
    const job = await createTestJob(manager.user.id, manager.company.id);
    testData.jobIds.push(job.id);
    
    // Your test code here
  });
});
```

### Helper Functions

#### Authentication Helpers (`helpers/auth-helpers.ts`)
- `loginViaUI(page, email, password)` - Login via UI
- `logoutViaUI(page)` - Logout via UI
- `clearAuthState(page)` - Clear all auth cookies and storage
- `getAuthState(page)` - Check if user is authenticated
- `createTestUser(email, password, userType)` - Create test user
- `deleteTestUser(email)` - Delete test user
- `cleanupTestUsers()` - Clean up all test users

#### Test Data Helpers (`helpers/offer-helpers.ts`)
- `createUniqueTestUsers()` - **Recommended**: Create unique contractor and manager with companies
- `createTestJob(managerId, companyId, jobData?)` - Create test job
- `createTestTender(managerId, companyId, tenderData?)` - Create test tender
- `createTestCompany(userId, companyData?)` - Create test company
- `cleanupTestData(jobIds, tenderIds, companyIds, userEmails)` - Clean up test data
- `getPoolContractorUser()` - **Deprecated**: Use `createUniqueTestUsers()` instead
- `getPoolManagerUser()` - **Deprecated**: Use `createUniqueTestUsers()` instead

#### Transaction Helpers (`helpers/db-transaction-helpers.ts`) - Optional
- `withTransaction(testFn)` - Execute test within a database transaction (requires database setup)

## Troubleshooting

### Tests fail with "Missing environment variable"

Make sure you've created `.env.test.local` with all required variables. 
- For local Supabase: Use `tests/env.local.example.txt` as template
- For cloud test project: Use `tests/env.example.txt` as template

### Local Supabase not starting

If you see Docker errors:
1. Ensure Docker Desktop is installed and running
2. Check Docker is accessible: `docker --version`
3. Try restarting Docker Desktop
4. Run setup again: `npm run supabase:setup`

For more troubleshooting, see [supabase/README.md](../supabase/README.md)

### Tests fail with "Could not access application"

Make sure your Next.js dev server is running on `http://localhost:3000`. The tests will automatically start the server if it's not running, but it's better to run it manually:

```bash
npm run dev
```

### Tests leave test users behind

If tests fail unexpectedly, test users might not be cleaned up. You can manually clean them up using the Supabase admin API or by running the cleanup helper function.

### Authentication state issues

If tests are failing due to authentication state issues:

1. Make sure you're clearing auth state in `beforeEach` hooks
2. Use `clearAuthState(page)` before each test
3. Check that test users are being created successfully

## CI/CD Integration

For CI/CD pipelines, make sure to:

1. Set all required environment variables
2. Install Playwright browsers: `npx playwright install --with-deps`
3. Run tests: `npm run test:e2e`

Example GitHub Actions workflow:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.SUPABASE_PUBLISHABLE_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Best Practices

### Test Isolation

1. **Unique Test Data**: Always create unique test data per test using `createUniqueTestUsers()` or unique identifiers
   ```typescript
   const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
   ```

2. **No Shared State**: Never share test data between tests (no pool users in new tests)

3. **Cleanup**: Use both `afterEach` hooks and `finally` blocks for reliable cleanup

4. **Test Serialization**: Use `test.describe.serial()` for tests that verify state changes or have dependencies
   ```typescript
   test.describe.serial('Critical State Validation', () => {
     test('should prevent duplicate bids', async ({ page }) => {
       // This test runs sequentially, not in parallel
     });
   });
   ```

### Test Reliability

1. **Wait for Navigation**: Always wait for navigation after form submissions
   ```typescript
   await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
   ```

2. **Unique Identifiers**: Use `${Date.now()}-${Math.random().toString(36).substring(7)}` for unique test data

3. **Error Handling**: Handle navigation errors gracefully
   ```typescript
   try {
     await page.goto('/some-page');
   } catch (error) {
     // Retry logic or error handling
   }
   ```

4. **Assertions**: Test both UI state and authentication state (cookies, redirects)

5. **Timeouts**: Use appropriate timeouts for flaky operations (default is 60 seconds)

### Test Configuration

- **Parallel Execution**: Disabled (`fullyParallel: false`) to prevent race conditions
- **Workers**: Limited to 1-2 workers locally, 1 in CI
- **Global Timeout**: 60 seconds per test
- **Retries**: Only in CI (2 retries)

### When to Run Tests

- **Before Committing**: Run full test suite
- **During Development**: Run only the file you're working on
- **After Major Changes**: Run full suite
- **In CI/CD**: Always run all tests

### Troubleshooting Flaky Tests

If tests are flaky:

1. **Check for shared state**: Ensure tests use unique data
2. **Verify cleanup**: Check that `afterEach` hooks are running
3. **Increase timeouts**: For slow operations
4. **Use serialization**: For tests that modify shared state
5. **Check test isolation**: Ensure tests don't depend on each other



