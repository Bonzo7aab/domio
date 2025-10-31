# Mock Data Toggle System

## Overview

This project implements a centralized data source toggle system that allows seamless switching between mock data and real database data. The system uses a hierarchical configuration approach with three levels of priority.

## Configuration Hierarchy

The system checks data sources in the following order (highest to lowest priority):

1. **LocalStorage** (`urbi-testing-settings.mockData`) - UI control via TestingModeManager
2. **Cookie** (`use_mocks`) - Runtime override via browser cookie
3. **Environment Variable** (`NEXT_PUBLIC_USE_MOCKS`) - Default fallback

## Usage

### Environment Variable Setup

Create a `.env.local` file in the project root:

```bash
# Enable mock data by default
NEXT_PUBLIC_USE_MOCKS=true
```

Or to use database:

```bash
# Use real database data
NEXT_PUBLIC_USE_MOCKS=false
```

### Runtime Switching

#### Via TestingModeManager UI

Access the TestingModeManager from your application settings or admin panel:

1. Navigate to TestingModeManager component
2. Toggle the "Mock dane" switch
3. Changes are saved to localStorage and take effect immediately
4. The indicator shows current data source (Mock Data or Database)

#### Via Browser Cookie

Set a cookie to override for the current session:

```javascript
// Enable mock data
document.cookie = 'use_mocks=true; max-age=86400; path=/';

// Use database
document.cookie = 'use_mocks=false; max-age=86400; path=/';

// Clear cookie to use other sources
document.cookie = 'use_mocks=; max-age=0; path=/';
```

Or use the provided helper function:

```typescript
import { setMockDataCookie, clearMockDataCookie } from '../lib/config/data-source';

// Set cookie (defaults to 30 days)
setMockDataCookie(true);

// Clear cookie
clearMockDataCookie();
```

## Architecture

### Core Modules

#### 1. Data Source Configuration
**File:** `src/lib/config/data-source.ts`

- `shouldUseMockData()` - Main function to determine data source
- `getDataSourceConfig()` - Get detailed configuration with source info
- `setMockDataCookie()` - Set runtime cookie override
- `clearMockDataCookie()` - Clear cookie to fall back to other sources

#### 2. Centralized Data Adapter
**File:** `src/lib/data/index.ts`

Unified functions that route to mock or database:

- `getJobsAndTenders(filters)` - Fetch jobs and tenders
- `getJobById(jobId)` - Fetch single job
- `getTenderById(tenderId)` - Fetch single tender
- `getContractors(filters)` - Fetch contractors (DB only, no mocks)
- `getManagers(filters)` - Fetch managers (DB only, no mocks)
- `getConversations(userId)` - Fetch user conversations
- `getMessages(conversationId)` - Fetch conversation messages

**Internal Wrapper Functions:**

- `fetchData<T>()` - Generic wrapper that checks mock/DB config and routes to appropriate source
- `fetchDataFromDB<T>()` - Generic wrapper for DB-only data sources (no mocks available)
- Individual `mockFetch*()` functions - Mock data implementations for each data type

### Components Updated

All major components now use the centralized adapter:

- `src/app/page.tsx` - Homepage job/tender listing
- `src/app/messages/page.tsx` - Messaging system
- `src/components/ContractorBrowsePage.tsx` - Contractor listing
- `src/components/ManagerBrowsePage.tsx` - Manager listing
- `src/components/JobPage.tsx` - Job details
- `src/components/TestingModeManager.tsx` - Added data source indicator

### Mock Data Available

The following data types have mock implementations:

- ✅ **Jobs** - Full mock data with details
- ✅ **Tenders** - Complete mock tenders
- ✅ **Messaging** - Conversations and messages
- ❌ **Contractors** - Fallback to database (no mocks available)
- ❌ **Managers** - Fallback to database (no mocks available)

## Implementation Pattern

### Before (Direct Database Access)

```typescript
import { fetchJobsAndTenders } from '../lib/database/jobs';
import { createClient } from '../lib/supabase/client';

const supabase = createClient();
const { data, error } = await fetchJobsAndTenders(supabase, filters);
```

### After (Centralized Adapter)

```typescript
import { getJobsAndTenders } from '../lib/data';

const { data, error } = await getJobsAndTenders(filters);
```

The adapter uses a generic wrapper pattern (`fetchData()`) that:
1. Checks the configuration hierarchy via `shouldUseMockData()`
2. Routes to appropriate data source (mock or DB) based on configuration
3. Returns normalized data in the same format
4. Provides type safety through TypeScript generics

**Implementation Details:**

Each data fetch function uses the `fetchData<T>()` wrapper which takes:
- A database fetch function (with supabase client)
- A mock fetch function (pure mock data logic)
- Arguments to pass to either function

This pattern eliminates duplication and centralizes the mock/DB detection logic.

## Benefits

- **Single Source of Truth** - All data fetching goes through one module
- **Zero Component Changes** - Components only change import statements
- **Graceful Fallback** - Falls back to database when mocks don't exist
- **Runtime Switching** - Change data source without restarting the app
- **No Breaking Changes** - Existing DB functions remain unchanged
- **Easy Testing** - Toggle mock data for development and testing

## Testing

### Test Mock Data Mode

1. Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`
2. Restart development server
3. Verify mock data appears in jobs/tenders/messages

### Test Database Mode

1. Set `NEXT_PUBLIC_USE_MOCKS=false` or remove from `.env.local`
2. Restart development server  
3. Verify real database data appears

### Test Runtime Switching

1. Open TestingModeManager UI
2. Toggle "Mock dane" switch on/off
3. Verify data source changes without page reload
4. Check indicator badge shows current source (Mock/DB)

### Test Cookie Override

1. Set environment to use DB mode
2. In browser console: `setMockDataCookie(true)`
3. Refresh page and verify mock data appears
4. Clear: `clearMockDataCookie()`
5. Refresh page and verify database data returns

## Future Enhancements

Potential improvements:

- Add mock data for contractors and managers
- Implement server-side rendering support for mock/DB switching
- Add data source indicator to main UI (not just TestingModeManager)
- Create admin panel for managing mock data
- Add ability to mix mock and real data (e.g., mock jobs but real users)

## Troubleshooting

### Mock data not appearing

1. Check `.env.local` has `NEXT_PUBLIC_USE_MOCKS=true`
2. Verify TestingModeManager shows "Mock Data" badge
3. Check browser console for configuration messages
4. Ensure cookies are not overriding (clear `use_mocks` cookie)

### Database data not appearing

1. Check Supabase connection is configured correctly
2. Verify environment variables for Supabase are set
3. Check Network tab for database query errors
4. Ensure mock mode is not enabled in any configuration

### Data source indicator not updating

1. Refresh TestingModeManager page after toggling
2. Check localStorage has correct settings
3. Verify no cookie is overriding localStorage
4. Check browser console for errors in data source detection

## Related Documentation

- `DATABASE_INTEGRATION.md` - Database setup and integration
- `TEST_SYSTEM.md` - Testing infrastructure
- `src/lib/database/` - Database query functions
- `src/mocks/` - Mock data definitions

