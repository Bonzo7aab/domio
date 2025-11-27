'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import type { AuthUser } from '../types/auth'

// Typ dla naszego kontekstu
type AuthContextType = {
  session: Session | null
  supabase: SupabaseClient
  user: AuthUser | null
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

// Tworzymy kontekst
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Komponent dostawcy
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user profile from the database
  const fetchUserProfile = useCallback(async (authUser: User): Promise<AuthUser | null> => {
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
  }, [supabase])

  // Refresh session and user profile
  const refreshSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      
      if (data.session?.user) {
        setIsLoading(true)
        const userProfile = await fetchUserProfile(data.session.user)
        setUser(userProfile)
        setIsLoading(false)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setIsLoading(false)
    }
  }, [supabase, fetchUserProfile])

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Computed isAuthenticated value
  // User is authenticated if they have a session, even if profile is still loading
  const isAuthenticated = !!session

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        
        setSession(data.session)
        
        if (data.session?.user) {
          // Fetch user profile for initial session
          const userProfile = await fetchUserProfile(data.session.user)
          if (mounted) {
            setUser(userProfile)
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Note: The onAuthStateChange listener below will handle SIGNED_IN events
    // and fetch the user profile automatically, so we don't need additional checks here

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (!mounted) return
        
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setIsLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || session) {
          // Handle SIGNED_IN, TOKEN_REFRESHED, or any session update
          setSession(session)
          
          if (session?.user) {
          // Fetch user profile immediately (not in setTimeout) so it loads faster
          setIsLoading(true)
          fetchUserProfile(session.user).then((userProfile) => {
            if (!mounted) return
            setUser(userProfile)
            console.log('User profile loaded:', userProfile?.firstName)
            setIsLoading(false)
          }).catch((error) => {
            console.error('Error fetching user profile:', error)
            if (mounted) {
              setUser(null)
              setIsLoading(false)
            }
          })
          } else {
            setUser(null)
            setIsLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile, refreshSession])

  return (
    <AuthContext.Provider value={{ session, supabase, user, logout, refreshSession, isAuthenticated, isLoading }}>
      <>{children}</>
    </AuthContext.Provider>
  )
}

// Hook do łatwego używania kontekstu w innych komponentach
export const useUserProfile = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a SupabaseProvider')
  }
  return context
}