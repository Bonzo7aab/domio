# Database Integration Guide

## Overview

This guide documents the migration from mock data to Supabase database integration for jobs and tenders in the Domio platform.

## Database Setup

### 1. Run Database Migrations

Execute the SQL files in order:

```bash
# In your Supabase SQL Editor, run:
1. database/01_core_tables.sql                      # Core database structure
2. database/02_communication.sql                    # Communication tables
3. database/03_file_management.sql                  # File management
4. database/04_security_policies.sql                # RLS policies
5. database/05_sample_data.sql                      # Sample categories and plans
6. database/08_comprehensive_job_tender_data.sql   # ALL mock jobs and tenders data
7. database/09_fix_company_insert_policy.sql       # Fix company INSERT policy (REQUIRED)
```

**Note:** File `07_sample_jobs_data.sql` is replaced by `08_comprehensive_job_tender_data.sql` which contains all mock data from the frontend.

### 2. Verify Installation

After running migrations, verify with:

```sql
-- Check jobs table
SELECT COUNT(*) FROM jobs WHERE status = 'active';

-- Check tenders table
SELECT COUNT(*) FROM tenders WHERE status = 'active';

-- Check categories
SELECT * FROM job_categories WHERE parent_id IS NULL;
```

## Architecture

### Database Utilities (`src/lib/database/jobs.ts`)

The main database utilities provide:

#### Functions:
- `fetchJobs()` - Fetch regular job postings
- `fetchTenders()` - Fetch tender postings
- `fetchJobsAndTenders()` - Fetch both combined and normalized
- `fetchJobById()` - Fetch single job by ID
- `fetchTenderById()` - Fetch single tender by ID

#### Interfaces:
```typescript
interface JobFilters {
  categories?: string[];
  subcategories?: string[];
  locations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  postType?: 'job' | 'tender' | 'all';
  status?: string;
  sortBy?: 'newest' | 'oldest' | 'budget_low' | 'budget_high' | 'deadline';
  searchQuery?: string;
  limit?: number;
  offset?: number;
}
```

### Component Integration

#### 1. EnhancedJobList Component
**Location:** `src/components/EnhancedJobList.tsx`

**Changes:**
- ✅ Added database fetching with `fetchJobsAndTenders()`
- ✅ Prioritizes database data over localStorage and mock data
- ✅ Shows loading state while fetching
- ✅ Displays badge when data comes from database
- ✅ Falls back to mock data if database is empty

**Usage:**
```typescript
// Automatically fetches on mount
<EnhancedJobList 
  filters={filters}
  onJobSelect={handleJobSelect}
  // ... other props
/>
```

#### 2. JobPage Component
**Location:** `src/components/JobPage.tsx`

**Changes:**
- ✅ Fetches individual job/tender from database by ID
- ✅ Shows loading state during fetch
- ✅ Falls back to localStorage then mock data
- ✅ Properly formats database data for component

**Usage:**
```typescript
// Automatically fetches job by ID
<JobPage 
  jobId={id}
  onBack={handleBack}
  onJobSelect={handleJobSelect}
/>
```

#### 3. JobList Component
**Location:** `src/components/JobList.tsx`

**Status:** ⏳ Pending - Still uses mock data
**Next Steps:** Apply same pattern as EnhancedJobList

## Data Flow

```
┌─────────────────┐
│   Component     │
│  (e.g. JobList) │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Database Utilities  │
│ (jobs.ts)           │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Supabase Client     │
│ (client.ts)         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Supabase Database   │
│ (PostgreSQL)        │
└─────────────────────┘
```

## Fallback Strategy

The system uses a three-tier fallback approach:

1. **Database (Primary)** - Fetches from Supabase
2. **LocalStorage (Secondary)** - User-created jobs from localStorage
3. **Mock Data (Fallback)** - Hardcoded mock data if database is empty

```typescript
// Priority order in code:
if (dbJobs.length > 0) {
  return [...dbJobs, ...storedJobs];
}
return [...storedJobs, ...mockJobs];
```

## Adding Sample Data

### Method 1: SQL Script (Comprehensive Migration)
Run the comprehensive migration that includes ALL mock data:
```sql
-- See: database/08_comprehensive_job_tender_data.sql
-- This file contains:
-- - 8 Companies (Wspólnoty and Spółdzielnie)
-- - 5 Regular Jobs (from mock data)
-- - 3 Tenders (from mock data)
-- - All necessary relationships and metadata
```

**What's Included:**
- **Companies:** Panorama, Zielone Osiedle, Sosnowy Las, Słoneczna, Parkowa 24, Centrum, Stary Rynek, Złota
- **Jobs:**
  - Elevator service (Gdańsk) - Premium
  - Pest control (Warszawa) - Urgent  
  - Fence replacement (Kraków) - Premium
  - Staircase cleaning (Warszawa)
  - Facade renovation (Kraków) - Urgent
- **Tenders:**
  - Thermal modernization (Warszawa) - 850k PLN
  - Elevator modernization (Gdańsk) - 420k PLN
  - Roof renovation (Poznań) - 280k PLN

### Method 2: Admin Interface (Future)
Create an admin interface to add jobs/tenders through UI.

### Method 3: API Import (Future)
Import data from external sources via API.

## Database Schema Reference

### Jobs Table
```sql
jobs (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category_id UUID,
  subcategory VARCHAR(100),
  manager_id UUID,
  company_id UUID,
  location VARCHAR(255),
  latitude DECIMAL,
  longitude DECIMAL,
  budget_min DECIMAL,
  budget_max DECIMAL,
  budget_type VARCHAR(20),
  currency VARCHAR(3),
  project_duration VARCHAR(100),
  deadline DATE,
  urgency VARCHAR(20),
  status VARCHAR(20),
  type VARCHAR(20),
  -- ... more fields
)
```

### Tenders Table
```sql
tenders (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category_id UUID,
  manager_id UUID,
  company_id UUID,
  location VARCHAR(255),
  latitude DECIMAL,
  longitude DECIMAL,
  estimated_value DECIMAL,
  currency VARCHAR(3),
  status VARCHAR(20),
  submission_deadline TIMESTAMPTZ,
  evaluation_deadline TIMESTAMPTZ,
  project_duration VARCHAR(100),
  -- ... more fields
)
```

## Testing

### Verify Database Integration

1. **Check Database Connection:**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('jobs').select('count');
console.log('Jobs count:', data);
```

2. **Test Component Rendering:**
- Visit `/` to see EnhancedJobList with database data
- Click on a job to test JobPage database fetching
- Check browser console for database logs

3. **Verify Fallback:**
- Temporarily disable database or clear data
- Confirm fallback to mock data works

## Performance Considerations

### Caching Strategy
- Database queries are made on component mount
- Data is cached in component state
- Re-fetches when sort order changes

### Optimization Opportunities
1. **Server-Side Rendering:**
   - Move database queries to server components
   - Pre-fetch data at build time for static pages

2. **Real-time Updates:**
   - Add Supabase real-time subscriptions
   - Auto-refresh when new jobs are added

3. **Pagination:**
   - Implement cursor-based pagination
   - Load more jobs on scroll

4. **Search Optimization:**
   - Add full-text search indexes
   - Implement search query caching

## Troubleshooting

### No Data Showing

1. Check database has data:
```sql
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM tenders;
```

2. Verify Supabase credentials in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

3. Check browser console for errors

### Type Errors

Regenerate database types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Slow Queries

1. Add database indexes:
```sql
CREATE INDEX idx_jobs_status_location ON jobs(status, location);
CREATE INDEX idx_tenders_status_deadline ON tenders(status, submission_deadline);
```

2. Enable query logging in Supabase dashboard

## Next Steps

### Immediate
- [ ] Update JobList component to use database
- [ ] Add error boundaries for database failures
- [ ] Implement proper loading skeletons

### Short-term
- [ ] Add server-side rendering for job lists
- [ ] Implement real-time job updates
- [ ] Add database indexes for common queries
- [ ] Create admin interface for data management

### Long-term
- [ ] Implement full-text search
- [ ] Add geospatial queries for location-based search
- [ ] Create data analytics dashboard
- [ ] Set up automated backups

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs in dashboard
3. Verify SQL migrations ran successfully
4. Check RLS policies are not blocking queries



