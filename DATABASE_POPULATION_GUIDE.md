# Database Population Guide

## Populate Database with 6 Ursynów Jobs

Since your database is currently empty, follow these steps to populate it with the 6 Ursynów jobs:

## Option 1: Via Supabase Dashboard (Recommended)

### Steps:

1. **Open Supabase SQL Editor:**
   - Go to: https://fabbgaqxsetnsppxegnx.supabase.co/project/_/sql
   - Log in to your Supabase account

2. **Run the migration:**
   - Click "New Query"
   - Copy the contents of: `database/11_populate_ursynow_jobs.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

3. **Verify the jobs:**
   - You should see: "✅ Created 6 jobs in Ursynów, Warsaw"
   - Check the results table showing 6 jobs with coordinates

4. **Refresh your app:**
   - Go to http://localhost:3000
   - The map will now show database jobs instead of mock data

## Option 2: Using Helper Script

```bash
node populate-ursynow-jobs.js
```

This will display the SQL and instructions to run it.

## What Gets Created

### Manager Account
- **Name:** Administrator Systemu
- **Email:** admin@ursynow.domio.pl
- **Type:** Manager

### 3 Companies
1. **Spółdzielnia Mieszkaniowa "Ursynów"**
   - Address: al. KEN 61, Ursynów

2. **Wspólnota Mieszkaniowa "Ursynów Północny"**
   - Address: ul. Lanciego 8, Ursynów

3. **Spółdzielnia Mieszkaniowa "Ursynów Centrum"**
   - Address: ul. Dereniowa 6, Ursynów

### 6 Jobs in Ursynów

| # | Job Title | Location | Type |
|---|-----------|----------|------|
| 1 | Konserwacja wind | 52.1456, 21.0512 | Premium |
| 2 | Dezynsekcja | 52.1328, 21.0495 | **Urgent** |
| 3 | Wymiana ogrodzenia | 52.1501, 21.0389 | Premium |
| 4 | Sprzątanie klatek | 52.1275, 21.0542 | Regular |
| 5 | Remont elewacji | 52.1389, 21.0625 | **Urgent** |
| 6 | Tereny zielone | 52.1425, 21.0311 | Regular |

## After Population

### Mock Data Removal

Once the database is populated, you can **remove `enhancedMockJobs`** from:
- `src/components/EnhancedJobList.tsx` (lines 27-222)

The app will automatically use database jobs:

```typescript
// This will be true after population
if (dbJobs.length > 0) {
  return [...dbJobs, ...storedJobs]; // ← Will use database jobs
}
// This won't execute anymore
return [...storedJobs, ...enhancedMockJobs]; 
```

### Verification

After running the migration:

```bash
# Check database has jobs
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data } = await supabase.from('jobs').select('title, latitude, longitude').eq('status', 'active');
  console.log('Jobs:', data?.length || 0);
  data?.forEach(j => console.log('  -', j.title, '→', j.latitude, j.longitude));
  process.exit(0);
})();
"
```

Expected output:
```
Jobs: 6
  - Konserwacja i naprawa wind → 52.1456 21.0512
  - Kompleksowa dezynsekcja → 52.1328 21.0495
  - Wymiana ogrodzenia → 52.1501 21.0389
  - Sprzątanie klatek → 52.1275 21.0542
  - Remont elewacji → 52.1389 21.0625
  - Konserwacja terenów → 52.1425 21.0311
```

## Current vs Future State

### Current (Using Mock Data)
```
EnhancedJobList.tsx
  ↓
dbJobs = [] (empty)
  ↓
Uses: enhancedMockJobs (6 jobs)
  ↓
Map displays: 6 mock jobs in Ursynów ✅
```

### After Population (Using Database)
```
EnhancedJobList.tsx
  ↓
dbJobs = [6 jobs from database]
  ↓
Uses: dbJobs (ignores mocks)
  ↓
Map displays: 6 database jobs in Ursynów ✅
enhancedMockJobs can be removed
```

## Files

- **SQL Migration:** `database/11_populate_ursynow_jobs.sql`
- **Helper Script:** `populate-ursynow-jobs.js`
- **Mock Data Location:** `src/components/EnhancedJobList.tsx` (lines 27-222)

## Summary

1. **Run SQL migration** in Supabase Dashboard
2. **Verify 6 jobs created** with coordinates
3. **Refresh your app** - will use database jobs
4. **Remove mock data** (optional, safe to keep as fallback)

The migration is safe to run multiple times (uses IF NOT EXISTS checks).
