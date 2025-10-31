# Manager Reviews Fix

## Issue
The "Opinie" (Reviews) tab in manager profiles was showing no reviews because:
1. The code was returning an empty array for reviews
2. No reviews were being fetched from the database
3. No sample reviews existed for managers in the database

## Solution
Updated the backend to fetch real reviews from the database and created a migration to populate sample reviews for managers.

## Changes Made

### 1. Backend Update (`src/lib/database/managers.ts`)
- Added review fetching from `company_reviews` table
- Mapped database reviews to ManagerProfile format
- Reviews now include:
  - Author name
  - Rating (1-5 stars)
  - Title and comment
  - Date created
  - Project reference

### 2. Database Migration (`database/25_manager_reviews.sql`)
- Seeds sample reviews for all managers
- Creates 3-8 reviews per manager from contractors
- Includes various ratings (mostly 4-5 stars)
- Reviews cover:
  - Professional management
  - Resident services
  - Timely payments
  - Modern approach
  - Problem resolution
  - Transparent documents
  - Budget efficiency
  - Communication quality

## How to Apply

Run the migration in your Supabase database:

```sql
-- Run the migration file
\i database/25_manager_reviews.sql
```

Or manually execute the SQL in the Supabase SQL Editor.

## Database Structure

Reviews are stored in the `company_reviews` table with the following structure:
- `company_id`: References the manager company
- `reviewer_id`: References the contractor/user who left the review
- `rating`: 1-5 star rating
- `title`: Review title
- `comment`: Review text
- `categories`: JSONB with detailed ratings (payment_timeliness, communication, project_clarity, professionalism)
- `is_public`: Boolean to show/hide review
- `is_verified`: Boolean for verified reviews
- `created_at`: Date when review was created

## Testing

After applying the migration:
1. Navigate to any manager profile
2. Click on the "Opinie" (Reviews) tab
3. You should now see 3-8 reviews displayed with:
   - Author name
   - Star rating
   - Title and comment
   - Date

## Note

The reviews are generated from contractors who have worked with the managers, providing authentic feedback about the management services.

