# Supabase Authentication Setup Guide

This guide will help you configure Supabase authentication for the Domio application.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Node.js and npm installed
3. The Domio project cloned and dependencies installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `domio-platform`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (usually takes 1-2 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...` - this is your publishable key)

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 4: Set Up Database Schema

1. Run the database migration scripts in order:
   ```bash
   # Execute these SQL scripts in your Supabase SQL Editor
   # 1. First, run the core tables
   psql -h your-db-host -U postgres -d postgres -f database/01_core_tables.sql
   
   # 2. Then communication tables
   psql -h your-db-host -U postgres -d postgres -f database/02_communication.sql
   
   # 3. File management tables
   psql -h your-db-host -U postgres -d postgres -f database/03_file_management.sql
   
   # 4. Security policies
   psql -h your-db-host -U postgres -d postgres -f database/04_security_policies.sql
   
   # 5. Sample data (optional)
   psql -h your-db-host -U postgres -d postgres -f database/05_sample_data.sql
   ```

   **Alternative: Use Supabase Dashboard**
   1. Go to **SQL Editor** in your Supabase dashboard
   2. Copy and paste each SQL file content
   3. Execute them in order

## Step 5: Configure Authentication Settings

### Email Authentication
1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **General**:
   - Enable "Enable email confirmations"
   - Set "Email confirmation redirect URL" to: `http://localhost:3000/auth/confirm`
   - Set "Password reset redirect URL" to: `http://localhost:3000/auth/update-password`

### Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize the templates for your application:
   - **Confirm signup**: Update with your app branding
   - **Reset password**: Update with your app branding
   - **Invite user**: Update if you plan to use invitations

### Provider Settings
1. Go to **Authentication** → **Providers**
2. Configure any additional providers you want to support:
   - **Google**: For Google OAuth
   - **GitHub**: For GitHub OAuth
   - **Discord**: For Discord OAuth

## Step 6: Configure Row Level Security (RLS)

The database schema includes RLS policies, but you may need to verify they're working:

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Verify that RLS is enabled for all tables
3. Check that the policies are correctly applied

## Step 7: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Try to register a new user
4. Check your email for the confirmation link
5. Try logging in with the confirmed account

## Step 8: Server Actions & Route Handlers

The authentication system includes:

### Server Actions (`src/app/auth/actions.ts`)
- `login()` - Sign in with email/password
- `signup()` - Register new user with profile creation
- `signOut()` - Sign out current user
- `resetPassword()` - Send password reset email
- `updatePassword()` - Update user password
- `updateProfile()` - Update user profile information

### Route Handlers
- `src/app/auth/confirm/route.ts` - Handles email confirmation links
- `middleware.ts` - Protects routes and manages session refresh

### Usage in Components
You can use these server actions in your forms:

```tsx
// In a login form
<form action={login}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">Log in</button>
</form>

// In a signup form
<form action={signup}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <input name="firstName" required />
  <input name="lastName" required />
  <select name="userType" required>
    <option value="contractor">Contractor</option>
    <option value="manager">Manager</option>
  </select>
  <button type="submit">Sign up</button>
</form>
```

## Step 9: Production Configuration

When deploying to production:

1. Update environment variables with production URLs:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. Update Supabase authentication settings:
   - Update redirect URLs to use your production domain
   - Configure custom SMTP if needed
   - Set up proper CORS settings

3. Consider setting up:
   - Custom SMTP for better email deliverability
   - Webhook endpoints for auth events
   - Rate limiting and abuse prevention

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**:
   - Verify your environment variables are correct
   - Check that the project URL and keys match your Supabase project

2. **Email confirmation not working**:
   - Check your redirect URLs in Supabase settings
   - Verify SMTP settings if using custom email

3. **RLS policies blocking requests**:
   - Check that policies are correctly written
   - Verify user authentication state
   - Use Supabase logs to debug policy issues

4. **TypeScript errors**:
   - Make sure `@supabase/supabase-js` is installed
   - Check that your database types are up to date

### Useful Commands

```bash
# Generate new types from your database
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts

# Check Supabase CLI installation
npx supabase --version

# Login to Supabase CLI
npx supabase login

# Link your project
npx supabase link --project-ref your-project-id
```

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use environment variables** for all sensitive data
3. **Enable RLS** on all tables with sensitive data
4. **Regularly audit** your RLS policies
5. **Use HTTPS** in production
6. **Implement rate limiting** for auth endpoints
7. **Monitor authentication logs** for suspicious activity

## Next Steps

After completing this setup:

1. Test all authentication flows thoroughly
2. Set up monitoring and logging
3. Configure backup strategies
4. Plan for scaling as your user base grows
5. Consider implementing additional security features like 2FA

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
3. Review the [Next.js Supabase integration guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
