import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthUser } from '../../types/auth'

/**
 * Shared function to fetch user profile from the database
 * Can be used by both client and server components
 */
export async function fetchUserProfile(
  supabase: SupabaseClient,
  authUser: User
): Promise<AuthUser | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      console.warn('No profile found for user:', authUser.id, profileError)
      return null
    }

    return {
      id: authUser.id,
      email: authUser.email!,
      firstName: profile.first_name,
      lastName: profile.last_name,
      userType: profile.user_type,
      phone: profile.phone || undefined,
      company: undefined, // Company field not available in user_profiles table
      isVerified: profile.is_verified,
      profileCompleted: profile.profile_completed,
      onboardingCompleted: profile.onboarding_completed,
      avatar: profile.avatar_url || undefined,
    }
  } catch (err) {
    console.error('Error fetching profile:', err)
    return null
  }
}

/**
 * Server-side function to get the currently authenticated user
 */
export async function getCurrentUser(supabase: SupabaseClient): Promise<AuthUser | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return null
    }

    return await fetchUserProfile(supabase, authUser)
  } catch (err) {
    console.error('Error fetching current user:', err)
    return null
  }
}

