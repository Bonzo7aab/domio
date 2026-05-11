-- Grant Domio panel admin by Supabase Auth email.
-- Run in Supabase Dashboard → SQL Editor (postgres role can read auth.users).
-- Requires migration database/50_admin_panel_kan8.sql (platform_role column).

INSERT INTO public.user_profiles (
  id,
  user_type,
  first_name,
  last_name,
  is_verified,
  profile_completed,
  onboarding_completed,
  platform_role
)
SELECT
  au.id,
  'manager',
  COALESCE(NULLIF(trim(au.raw_user_meta_data->>'first_name'), ''), 'Admin'),
  COALESCE(NULLIF(trim(au.raw_user_meta_data->>'last_name'), ''), 'Operator'),
  true,
  true,
  true,
  'platform_admin'
FROM auth.users au
WHERE lower(au.email) = lower('admin@openpro.pl')
ON CONFLICT (id) DO UPDATE SET
  platform_role = 'platform_admin',
  updated_at = NOW();

-- Verify:
-- SELECT id, email FROM auth.users au JOIN user_profiles up ON up.id = au.id WHERE lower(au.email) = lower('admin@openpro.pl');
