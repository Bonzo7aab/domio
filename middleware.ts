import { updateSession } from './src/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * First path segment for routes defined under `src/app`.
 * Anything else (e.g. /foo-bar) is redirected to `/` after session refresh.
 * Invalid dynamic IDs (e.g. /jobs/…) are handled by `src/app/not-found.tsx`.
 */
const ALLOWED_FIRST_SEGMENTS = new Set<string>([
  'account',
  'admin',
  'api',
  'auth',
  'bookmarked-jobs',
  'contractor-dashboard',
  'contractors',
  'expert-consultation',
  'forgot-password',
  'job-type-selection',
  'jobs',
  'login',
  'manager-dashboard',
  'managers',
  'messages',
  'onboarding',
  'post-job',
  'post-contest',
  'post-tender',
  'privacy',
  'profile-completion',
  'register',
  'tender-creation',
  'terms',
  'tutorial',
  'user-type-selection',
  'verification',
  'welcome',
])

function isKnownAppRoute(pathname: string): boolean {
  if (pathname === '/') return true
  const segment = pathname.split('/').filter(Boolean)[0]
  if (!segment) return true
  if (segment.startsWith('.')) return true
  return ALLOWED_FIRST_SEGMENTS.has(segment)
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value)
  })
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request)
  if (sessionResponse.headers.has('location')) {
    return sessionResponse
  }
  if (!isKnownAppRoute(request.nextUrl.pathname)) {
    const redirectHome = NextResponse.redirect(new URL('/', request.url))
    copyCookies(sessionResponse, redirectHome)
    return redirectHome
  }
  return sessionResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
