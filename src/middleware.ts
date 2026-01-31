import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Build SHA for debugging
const BUILD_SHA = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)

// HTML routes that should never be cached
const NO_CACHE_ROUTES = ['/', '/quiz', '/results', '/access', '/login']
const NO_CACHE_PREFIXES = ['/preview', '/report', '/auth']

// Static assets that should NOT have no-store applied
const STATIC_PREFIXES = ['/_next', '/favicon', '/sample-report', '/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and API routes
  if (STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Check if this is an HTML route that should not be cached
  const isNoCacheRoute = NO_CACHE_ROUTES.includes(pathname) ||
    NO_CACHE_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (isNoCacheRoute) {
    const response = NextResponse.next()

    // Set cache control to prevent edge caching
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('x-ideafit-build', BUILD_SHA)

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (sample PDFs, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.pdf$|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)',
  ],
}
