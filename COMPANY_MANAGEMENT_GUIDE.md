# Company Management Feature Guide

## Overview

The Company Management feature allows users to create and manage their company/organization profiles within the Domio platform. This is essential for property managers and contractors to establish their professional presence.

## Database Setup

### ⚠️ IMPORTANT: Required Migration

Before using the company management feature, you **MUST** run this migration:

```sql
-- In Supabase SQL Editor, run:
database/09_fix_company_insert_policy.sql
```

This fixes a missing RLS policy that prevents users from creating companies.

### What This Migration Does

1. **Adds INSERT policy** - Allows authenticated users to create companies
2. **Adds DELETE policy** - Allows company owners to delete their companies
3. **Verifies policies** - Shows all active policies for the companies table

### Without This Migration

You'll get this error when trying to save company data:
```
Error: new row violates row-level security policy for table "companies"
```

## Feature Components

### 1. Database Utilities (`src/lib/database/companies.ts`)

#### Functions:

**`fetchUserPrimaryCompany(supabase, userId)`**
- Fetches user's main company
- Returns null if no company exists
- Used on page load

**`fetchUserCompanies(supabase, userId)`**
- Fetches all companies for a user
- Future support for multiple companies
- Ordered by primary company first

**`upsertUserCompany(supabase, userId, companyData)`**
- Creates new company OR updates existing
- Smart detection: checks if user already has primary company
- Creates `user_companies` relationship automatically
- Returns saved company data

**`deleteUserCompany(supabase, userId, companyId)`**
- Removes user-company relationship
- Deletes company if no other users
- Safe cleanup logic

### 2. UI Component (`src/components/CompanyManagementForm.tsx`)

#### States:

1. **Loading** - Fetching company data
2. **Empty** - No company exists
3. **View** - Company exists, read-only mode
4. **Edit** - User is editing company data

#### Features:

- ✅ Auto-loads existing company
- ✅ Read-only by default
- ✅ Edit/Save/Cancel buttons
- ✅ Validation (company name required)
- ✅ Success/error messages
- ✅ Auto-dismissing alerts

## How to Use

### As a User

1. **Access Company Tab**
   - Go to Account Settings
   - Click "Firma" tab

2. **Add Company (First Time)**
   - Click "Dodaj firmę" button
   - Fill in company details
   - Click "Zapisz"

3. **Edit Company**
   - Click "Edytuj" button
   - Modify fields
   - Click "Zapisz" to save or "Anuluj" to cancel

### Company Fields

#### Required:
- **Nazwa firmy** - Company/organization name

#### Optional:
- **Typ organizacji** - Company type (dropdown)
- **NIP** - Polish tax number
- **Telefon** - Company phone
- **Email** - Company email
- **Adres** - Street address
- **Miasto** - City
- **Kod pocztowy** - Postal code
- **Opis firmy** - Company description

### Company Types

- Wspólnota Mieszkaniowa
- Spółdzielnia Mieszkaniowa
- Zarząd Nieruchomości
- Zarząd Wspólnoty
- Firma Wykonawcza
- Firma Budowlana
- Usługodawca

## Database Structure

### Tables Involved

**`companies`**
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL
type            VARCHAR(50) NOT NULL
nip             VARCHAR(20)
address         TEXT
city            VARCHAR(100)
postal_code     VARCHAR(10)
phone           VARCHAR(20)
email           VARCHAR(255)
description     TEXT
is_verified     BOOLEAN
verification_level VARCHAR(20)
```

**`user_companies`** (Junction Table)
```sql
id          UUID PRIMARY KEY
user_id     UUID -> user_profiles(id)
company_id  UUID -> companies(id)
role        VARCHAR(100)  -- 'owner', 'manager', 'employee'
is_primary  BOOLEAN
is_active   BOOLEAN
```

### Relationships

```
User (user_profiles)
    ↓
user_companies (relationship)
    ↓
Company (companies)
```

A user can be associated with multiple companies, but one is marked as `is_primary`.

## Security

### Row Level Security (RLS) Policies

**Companies Table:**
- ✅ SELECT - Users can view their companies
- ✅ SELECT - Authenticated users can view public companies
- ✅ INSERT - Authenticated users can create companies ⭐
- ✅ UPDATE - Company owners/managers can update
- ✅ DELETE - Company owners can delete

**User Companies Table:**
- ✅ SELECT - Users can view their relationships
- ✅ INSERT - Users can create their relationships
- ✅ UPDATE - Users can update their relationships

### Security Checks

The `upsertUserCompany()` function ensures:
- User must be authenticated
- New company automatically creates owner relationship
- Updates require existing ownership/management role
- Deletes check for other users before removing company

## Integration

### Account Page Integration

File: `src/components/UserAccountPageClient.tsx`

Added new tab:
```tsx
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="profile">Profil</TabsTrigger>
  <TabsTrigger value="company">Firma</TabsTrigger>  ⭐ NEW
  <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
  <TabsTrigger value="notifications">Powiadomienia</TabsTrigger>
</TabsList>
```

### Data Flow

```
User clicks "Zapisz"
    ↓
CompanyManagementForm.handleSaveCompany()
    ↓
upsertUserCompany() in companies.ts
    ↓
Check if user has primary company
    ↓
If exists: UPDATE companies table
If not: INSERT companies table + INSERT user_companies table
    ↓
Success message & return to read-only mode
```

## Testing

### Verify Setup

1. **Check policies exist:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'companies';
```

Expected output:
- Users can view their companies (SELECT)
- Authenticated users can view public companies (SELECT)
- Users can update their companies (UPDATE)
- **Authenticated users can insert companies (INSERT)** ⭐
- Company owners can delete their companies (DELETE)

2. **Test company creation:**
```sql
-- Should work for authenticated user
INSERT INTO companies (name, type) 
VALUES ('Test Company', 'contractor');
```

### Manual Testing

1. Register/login as a user
2. Go to `/account`
3. Click "Firma" tab
4. Click "Dodaj firmę"
5. Fill in company name
6. Click "Zapisz"
7. Should see success message
8. Data should appear in read-only mode

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause:** Missing INSERT policy for companies table

**Solution:** Run migration `09_fix_company_insert_policy.sql`

### Error: "Could not find the 'company' column"

**Cause:** Trying to update `user_profiles.company` which doesn't exist

**Solution:** Already fixed - company data now in `companies` table

### Company not saving

**Debugging steps:**
1. Check browser console for errors
2. Verify user is authenticated: `console.log(user.id)`
3. Check Supabase logs in dashboard
4. Verify RLS policies are active

### Company not loading

**Debugging steps:**
1. Check if `user_companies` relationship exists:
```sql
SELECT * FROM user_companies WHERE user_id = 'YOUR_USER_ID';
```

2. Check if company exists:
```sql
SELECT * FROM companies WHERE id = 'COMPANY_ID';
```

## Future Enhancements

### Planned Features

- [ ] **Multiple Companies** - Support for users managing multiple companies
- [ ] **Company Verification** - Request verification badge
- [ ] **Company Logo Upload** - Image upload for company logo
- [ ] **Company Team** - Invite other users to company
- [ ] **Company Documents** - Attach certificates, licenses
- [ ] **Company Portfolio** - Showcase completed projects
- [ ] **Company Statistics** - View jobs posted, applications received

### API Enhancements

- [ ] Real-time company updates
- [ ] Company search/filtering
- [ ] Company comparison
- [ ] Company analytics

## Migration Checklist

Before using company management:

- [ ] Run `01_core_tables.sql`
- [ ] Run `02_communication.sql`
- [ ] Run `03_file_management.sql`
- [ ] Run `04_security_policies.sql`
- [ ] Run `05_sample_data.sql`
- [ ] Run `08_comprehensive_job_tender_data.sql`
- [ ] **Run `09_fix_company_insert_policy.sql`** ⭐ REQUIRED

After migrations:

- [ ] Verify policies exist (see Testing section)
- [ ] Test creating a company
- [ ] Test updating a company
- [ ] Test canceling edits

## Support

For issues:
1. Check migration ran successfully
2. Verify RLS policies in Supabase dashboard
3. Check browser console for client-side errors
4. Review Supabase logs for server-side errors

## Summary

✅ **Setup:** Run migration 09
✅ **Location:** Account Settings → Firma tab
✅ **Features:** Create, Read, Update company data
✅ **Security:** RLS policies enforce ownership
✅ **UX:** Edit/Save/Cancel pattern with validation

The company management feature is production-ready after running the required migration! 🚀

