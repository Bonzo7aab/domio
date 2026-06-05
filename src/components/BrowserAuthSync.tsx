'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserProfile } from '../contexts/AuthContext'

/**
 * After server-side sign-in/sign-out, the browser Supabase client can hold stale
 * cookies until explicitly refreshed. Middleware handles server cookies; this
 * syncs the client auth state when redirected with `?refresh_browser_auth=1`.
 */
export function BrowserAuthSync() {
  const searchParams = useSearchParams()
  const { refreshSession } = useUserProfile()

  useEffect(() => {
    if (searchParams?.get('refresh_browser_auth') !== '1') return

    void refreshSession().finally(() => {
      const url = new URL(window.location.href)
      url.searchParams.delete('refresh_browser_auth')
      window.history.replaceState({}, '', url.toString())
    })
  }, [searchParams, refreshSession])

  return null
}
