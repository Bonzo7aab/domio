import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '../../../types/database'
import { sanitizeRedirectPath } from '../../../lib/auth/redirectPath'

/**
 * Exchanges Supabase PKCE `code` from the recovery / magic-link redirect, sets session cookies, then redirects to `next`.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = sanitizeRedirectPath(url.searchParams.get('next'), '/')

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll can fail in some Server Component contexts; route handlers normally succeed
          }
        },
      },
    }
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin).toString())
    }
  }

  return NextResponse.redirect(new URL('/logowanie?error=reset', url.origin).toString())
}
