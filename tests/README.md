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

### Automatic Cleanup

- Test users are automatically cleaned up after each test suite completes
- Global teardown runs after all tests to clean up any remaining test users
- Individual tests clean up their own test users in `finally` blocks

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

```typescript
import { createTestUser, deleteTestUser } from '../helpers/auth-helpers';

test('my test', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  await createTestUser(email, password, 'contractor');
  
  try {
    // Your test code here
  } finally {
    await deleteTestUser(email);
  }
});
```

### Helper Functions

- `loginViaUI(page, email, password)` - Login via UI
- `logoutViaUI(page)` - Logout via UI
- `clearAuthState(page)` - Clear all auth cookies and storage
- `getAuthState(page)` - Check if user is authenticated
- `createTestUser(email, password, userType)` - Create test user
- `deleteTestUser(email)` - Delete test user
- `cleanupTestUsers()` - Clean up all test users

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

1. **Isolation**: Each test should be independent and clean up after itself
2. **Unique Data**: Use timestamps or UUIDs to create unique test data
3. **Cleanup**: Always clean up test users in `finally` blocks
4. **Wait for Navigation**: Always wait for navigation after form submissions
5. **Assertions**: Test both UI state and authentication state (cookies, redirects)
6. **Error Cases**: Test validation and error scenarios comprehensively



