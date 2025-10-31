# Authentication Migration Guide

## Overview

This guide outlines the migration from the custom `useAuth` hook to Supabase's recommended server-side authentication approach.

## Why Migrate?

### Problems with Current `useAuth` Hook:
1. **Redundant State Management**: Manually managing auth state when Supabase handles it via cookies
2. **Performance Issues**: Making unnecessary database calls on every auth state change
3. **Client-Side Only**: Limited to client components, missing server-side benefits
4. **Race Conditions**: Potential inconsistencies between auth state and profile data
5. **Complexity**: Over-engineered solution for simple authentication needs

### Benefits of Server-Side Approach:
1. **Better Performance**: Server-side rendering with cached user data
2. **Security**: Server-side validation and protection
3. **SEO**: Server-rendered authenticated content
4. **Simplicity**: Less client-side state management
5. **Supabase Best Practices**: Following official recommendations

## New Architecture

### 1. Server-Side Authentication (`src/lib/auth/server.ts`)
```typescript
// Get current user (for Server Components)
const user = await getCurrentUser()

// Require authentication (redirects if not authenticated)
const user = await requireAuth()

// Require specific user type
const user = await requireUserType('manager')

// Require completed onboarding
const user = await requireOnboardingComplete()
```

### 2. Server Actions (`src/lib/auth/actions.ts`)
```typescript
// Login
await loginAction({ email, password })

// Register
await registerAction({ email, password, firstName, lastName, userType })

// Logout
await logoutAction()

// Update profile
await updateUserAction({ first_name, last_name, phone })
```

### 3. Simplified Client Hook (`src/hooks/useAuthClient.ts`)
```typescript
// Only for interactive features that need real-time updates
const { user, isAuthenticated, isLoading } = useAuthClient()
```

## Migration Steps

### Step 1: Update Server Components
Replace `useAuth()` with server-side functions:

**Before:**
```tsx
'use client'
import { useAuth } from '../hooks/useAuth'

export function Header() {
  const { user, isAuthenticated } = useAuth()
  // ...
}
```

**After:**
```tsx
import { getCurrentUser } from '../lib/auth/server'

export async function Header() {
  const user = await getCurrentUser()
  const isAuthenticated = !!user
  // ...
}
```

### Step 2: Update Forms to Use Server Actions
Replace client-side auth calls with Server Actions:

**Before:**
```tsx
const { login } = useAuth()
await login(credentials)
```

**After:**
```tsx
import { loginAction } from '../lib/auth/actions'

<form action={loginAction}>
  {/* form fields */}
</form>
```

### Step 3: Update Protected Pages
Use server-side protection:

**Before:**
```tsx
'use client'
import { useAuth } from '../hooks/useAuth'

export function ProtectedPage() {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <Loading />
  if (!user) return <LoginPrompt />
  
  return <PageContent />
}
```

**After:**
```tsx
import { requireAuth } from '../lib/auth/server'

export default async function ProtectedPage() {
  const user = await requireAuth() // Automatically redirects if not authenticated
  
  return <PageContent user={user} />
}
```

### Step 4: Update Interactive Components
Use the simplified client hook only when needed:

```tsx
'use client'
import { useAuthClient } from '../hooks/useAuthClient'

export function RealTimeComponent() {
  const { user, isAuthenticated } = useAuthClient()
  // Only use this for real-time features, subscriptions, etc.
}
```

## File Changes Required

### Files to Update:
1. `src/components/Header.tsx` → Use `HeaderServer.tsx` as reference
2. `src/components/UserAccountPage.tsx` → Convert to server component
3. `src/components/LoginPage.tsx` → Use `LoginPageServer.tsx` as reference
4. `src/components/RegisterPage.tsx` → Convert to use Server Actions
5. All protected pages → Use `requireAuth()` or `requireUserType()`

### Files to Remove (After Migration):
1. `src/hooks/useAuth.ts` → Replace with server-side functions
2. `src/hooks/useUser.ts` → No longer needed

### New Files Created:
1. `src/lib/auth/server.ts` → Server-side auth utilities
2. `src/lib/auth/actions.ts` → Server Actions for auth operations
3. `src/hooks/useAuthClient.ts` → Simplified client hook
4. `src/components/HeaderServer.tsx` → Server-side header example
5. `src/components/LoginPageServer.tsx` → Server-side login example
6. `src/components/LogoutButton.tsx` → Logout Server Action component

## Testing Checklist

- [ ] Login flow works with Server Actions
- [ ] Registration flow works with Server Actions
- [ ] Logout redirects properly
- [ ] Protected routes redirect to login when not authenticated
- [ ] User type-specific routes work correctly
- [ ] Onboarding flow redirects work
- [ ] Profile updates work with Server Actions
- [ ] Real-time features still work with `useAuthClient`

## Benefits After Migration

1. **Better Performance**: Server-side rendering reduces client-side JavaScript
2. **Improved Security**: Server-side validation and protection
3. **Better UX**: Faster page loads and better SEO
4. **Simpler Code**: Less complex state management
5. **Supabase Compliance**: Following official best practices
6. **Future-Proof**: Aligned with Next.js App Router patterns

## Rollback Plan

If issues arise, you can temporarily:
1. Keep both approaches running in parallel
2. Use feature flags to switch between old and new auth
3. Gradually migrate components one by one
4. Keep the old `useAuth` hook as backup until fully tested

