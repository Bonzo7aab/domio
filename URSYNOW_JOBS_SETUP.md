# Ursynów Jobs Setup

## Current Status

✅ **Map is displaying 6 jobs in Ursynów, Warsaw**

The application is currently using **mock data** with all jobs located in Ursynów since the database is empty.

## Job Locations

All 6 jobs are scattered across Ursynów district:

### 1. Konserwacja i naprawa wind
- **Location:** al. KEN 61, Ursynów Północ
- **Coordinates:** 52.1456, 21.0512
- **Type:** Premium
- **Company:** Spółdzielnia Mieszkaniowa "Ursynów"

### 2. Dezynsekcja i deratyzacja ⚠️ URGENT
- **Location:** ul. Lanciego 8, Ursynów Wschód
- **Coordinates:** 52.1328, 21.0495
- **Type:** Urgent (red marker)
- **Company:** Wspólnota Mieszkaniowa "Ursynów Północny"

### 3. Wymiana ogrodzenia i bram
- **Location:** ul. Dereniowa 6, Ursynów Zachód
- **Coordinates:** 52.1501, 21.0389
- **Type:** Premium
- **Company:** Spółdzielnia Mieszkaniowa "Ursynów Centrum"

### 4. Sprzątanie klatek schodowych
- **Location:** ul. Puszczyka 22, Ursynów Południowy
- **Coordinates:** 52.1275, 21.0542
- **Type:** Regular
- **Company:** Wspólnota Mieszkaniowa "Ursynów Południowy"

### 5. Remont elewacji budynku ⚠️ URGENT
- **Location:** ul. Filipiny Płaskowickiej 5, Ursynów Wschód
- **Coordinates:** 52.1389, 21.0625
- **Type:** Urgent (red marker)
- **Company:** Wspólnota Mieszkaniowa "Ursynów Wschód"

### 6. Konserwacja terenów zielonych
- **Location:** ul. Wąwozowa 28, Ursynów Zachód
- **Coordinates:** 52.1425, 21.0311
- **Type:** Regular
- **Company:** Spółdzielnia Mieszkaniowa "Ursynów Zachód"

## Map Configuration

- **Center:** Ursynów (52.1394, 21.0458)
- **Zoom:** 11 (district-level view)
- **Markers:** 6 total (4 blue, 2 red urgent)

## Data Flow

### Current Setup (No Database Jobs)
```
EnhancedJobList.tsx (mock data)
    ├─→ 6 jobs with Ursynów coordinates
    └─→ Passed to page.tsx
            └─→ Passed to EnhancedMapViewGoogleMaps
                    └─→ Converted to map markers
                            └─→ Displayed on Google Maps
```

### When Database Has Jobs
```
Database (Supabase)
    ├─→ Fetched by page.tsx useEffect
    └─→ Passed to EnhancedMapViewGoogleMaps
            └─→ Converted to map markers
                    └─→ Displayed on Google Maps
```

## Database Setup (When Ready)

When you're ready to populate the database with real jobs:

### Option 1: Run Migration Script
```bash
# This will create 6 jobs in the database with Ursynów locations
psql <your_connection_string> -f database/10_update_jobs_ursynow_locations.sql
```

### Option 2: Update Existing Jobs
If you already have jobs in the database, run:
```bash
node update-db-jobs-ursynow.js
```

This will update existing jobs to have Ursynów coordinates.

### Option 3: Use Supabase Dashboard
1. Go to Supabase SQL Editor
2. Run the migration: `database/10_update_jobs_ursynow_locations.sql`
3. Verify jobs have latitude/longitude values

## Files Structure

### Mock Data (Currently Active)
- **File:** `src/components/EnhancedJobList.tsx`
- **Lines:** 28-221 (enhancedMockJobs array)
- **Jobs:** 6 with Ursynów coordinates

### Database Migration
- **File:** `database/10_update_jobs_ursynow_locations.sql`
- **Purpose:** Create 6 jobs in database with Ursynów locations
- **Status:** Ready to run when needed

### Update Script
- **File:** `update-db-jobs-ursynow.js`
- **Purpose:** Update existing database jobs to Ursynów
- **Usage:** `node update-db-jobs-ursynow.js`

## How It Works Now

1. **Page loads** → `src/app/page.tsx`
2. **Tries to fetch from database** → Returns empty array
3. **EnhancedJobList falls back to mock data** → 6 Ursynów jobs
4. **Jobs passed to map component** → `EnhancedMapViewGoogleMaps`
5. **Markers created** → 6 markers in Ursynów
6. **Map displays** → Centered on Ursynów with all markers visible

## Verification

To verify the current setup:
1. Open your app at http://localhost:3000
2. You should see 6 jobs in the job list
3. Map on right shows 6 markers in Ursynów
4. All markers are within the Ursynów district
5. Map is centered showing all 6 jobs

## Troubleshooting

### If database jobs appear but have wrong coordinates:
```bash
node update-db-jobs-ursynow.js
```

### If you want to populate database:
1. First run core database migrations: `database/01_core_tables.sql`
2. Then run: `database/10_update_jobs_ursynow_locations.sql`

### If mock data not showing:
- Check `src/components/EnhancedJobList.tsx` lines 28-221
- Verify all 6 jobs have lat/lng coordinates
- Check browser console for errors

## Summary

✅ **6 jobs configured** - All in Ursynów
✅ **Mock data ready** - Working immediately
✅ **Database migration ready** - For when you populate DB
✅ **Map centered** - Ursynów at zoom 11
✅ **Clean interface** - No unnecessary UI elements

The system will automatically use database jobs when available, otherwise falls back to mock data. Both are configured with Ursynów locations!
