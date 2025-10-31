# Manager Portfolio Data Fix

## Issue
The "Nieruchomości" (Properties) tab in manager profiles was showing no data because portfolio information wasn't being fetched from the database.

## Solution
Created a database migration that:
1. Adds a `portfolio_data` JSONB column to the `companies` table
2. Populates managed buildings data for all managers based on their statistics
3. Updates the frontend to read from the database instead of using empty arrays

## Changes Made

### 1. Database Migration (`database/24_manager_portfolio_data.sql`)
- Added `portfolio_data` JSONB column to store portfolio information
- Created function to generate portfolio data based on manager statistics:
  - Number of buildings
  - Number of units
  - Property types and locations
  - Images and project history
- Generates 2-4 properties per manager based on their actual building count

### 2. Backend Update (`src/lib/database/managers.ts`)
- Updated `fetchManagerById` to read `portfolio_data` from the database
- Changed from returning empty arrays to returning actual portfolio data

### 3. Frontend Update (`src/components/ManagerProfilePage.tsx`)
- Simplified the code to directly map from database data
- Removed mock data generation logic
- Properties now display directly from the `portfolio.managedBuildings` array

## How to Apply

Run the migration in your Supabase database:

```sql
-- Run the migration file
\i database/24_manager_portfolio_data.sql
```

Or manually execute the SQL in the Supabase SQL Editor.

## What the Data Contains

Each manager's portfolio now includes:
- **Name**: Property name (e.g., "Osiedle I", "Kompleks II")
- **Type**: Building type (Bloki mieszkalne, Osiedle, etc.)
- **Address**: Location with city and district
- **Units**: Number of units in the property
- **Year Built**: Based on the manager's years of experience
- **Images**: Sample building images from Unsplash
- **Recent Projects**: List of recent project types

## Testing

After applying the migration:
1. Navigate to any manager profile
2. Click on the "Nieruchomości" (Properties) tab
3. You should now see 2-4 properties displayed with images and details

## Note

The portfolio data is generated based on existing manager statistics (buildings_count, units_count, etc.) from the `manager_data` JSONB column in the `companies` table.

