import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '../../types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = [
    '/contractor-dashboard',
    '/manager-dashboard',
    '/account',
    '/post-job',
    '/post-tender',
    '/tender-creation',
    '/admin',
  ]

  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect to login if accessing protected route without authentication
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const pathname = request.nextUrl.pathname
  const isManagerOnlyPath =
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    pathname === '/manager-dashboard' ||
    pathname.startsWith('/manager-dashboard/')
  const isContractorOnlyPath =
    pathname === '/contractor-dashboard' || pathname.startsWith('/contractor-dashboard/')
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAuthEntryPath = pathname === '/login' || pathname === '/register'

  // Fetch role only when we may need to act on it
  if (
    user &&
    (isAuthEntryPath || isManagerOnlyPath || isContractorOnlyPath || isAdminPath)
  ) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, platform_role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.platform_role === 'platform_admin'
    const isContractor = profile?.user_type === 'contractor'
    const isManager = profile?.user_type === 'manager'

    const homePathFor = (() => {
      if (isAdmin) return '/admin'
      if (isContractor) return '/contractor-dashboard'
      return '/manager-dashboard'
    })()

    // Already authenticated → bounce away from /login & /register to role-correct landing
    if (isAuthEntryPath) {
      const url = request.nextUrl.clone()
      url.pathname = homePathFor
      url.search = ''
      return NextResponse.redirect(url)
    }

    // /account & /manager-dashboard are manager-only
    if (isManagerOnlyPath && !isAdmin && !isManager) {
      const url = request.nextUrl.clone()
      url.pathname = homePathFor
      return NextResponse.redirect(url)
    }
    if (isManagerOnlyPath && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // /contractor-dashboard is contractor-only (admin lands on /admin instead)
    if (isContractorOnlyPath && !isContractor && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = homePathFor
      return NextResponse.redirect(url)
    }
    if (isContractorOnlyPath && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // /admin is admin-only
    if (isAdminPath && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = homePathFor
      return NextResponse.redirect(url)
    }
  }

  // Redirect to onboarding if profile is not completed (only for protected paths)
  // if (user && isProtectedPath) {
  //   const { data: profile } = await supabase
  //     .from('user_profiles')
  //     .select('profile_completed, onboarding_completed')
  //     .eq('id', user.id)
  //     .single()

  //   if (!profile?.profile_completed || !profile?.onboarding_completed) {
  //     const url = request.nextUrl.clone()
  //     url.pathname = '/onboarding'
  //     return NextResponse.redirect(url)
  //   }
  // }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}
