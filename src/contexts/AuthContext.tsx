'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import type { AuthUser } from '../types/auth'
import { fetchUserProfile } from '../lib/auth/user-profile'

// Typ dla naszego kontekstu
type AuthContextType = {
  session: Session | null
  supabase: SupabaseClient
  user: AuthUser | null
  logout: () => Promise<void>
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
  const isAuthenticated = !!session && !!user

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        
        setSession(data.session)
        
        if (data.session?.user) {
          // Fetch user profile for initial session
          const userProfile = await fetchUserProfile(supabase, data.session.user)
          if (mounted) {
            setUser(userProfile)
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      }
    }

    getInitialSession()

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (!mounted) return
        
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setIsLoading(false)
        } else if (session) {
          setSession(session)
          
          // Handle user profile fetching asynchronously to avoid blocking the callback
          setTimeout(async () => {
            if (!mounted) return
            
            setIsLoading(true)
            try {
              const userProfile = await fetchUserProfile(supabase, session.user)
              if (mounted) {
                setUser(userProfile)
                console.log('User profile loaded:', userProfile?.firstName)
              }
            } catch (error) {
              console.error('Error fetching user profile:', error)
              if (mounted) {
                setUser(null)
              }
            } finally {
              if (mounted) {
                setIsLoading(false)
              }
            }
          }, 0)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])
  return (
    <AuthContext.Provider value={{ session, supabase, user, logout, isAuthenticated, isLoading }}>
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