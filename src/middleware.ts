import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Build SHA and timestamp for debugging
const BUILD_SHA = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)
const BUILD_TIMESTAMP = new Date().toISOString()

// Routes that should never be cached (pages + API)
const NO_CACHE_ROUTES = ['/', '/quiz', '/results', '/access', '/login', '/health', '/compare']
// /debug already covered, but being explicit for clarity
const NO_CACHE_PREFIXES = ['/preview', '/report', '/auth', '/api', '/debug', '/admin']

// Static assets that should NOT have headers modified
const STATIC_PREFIXES = ['/_next', '/favicon', '/sample-report']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets only
  if (STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Check if this is a dynamic route that should not be cached
  const isNoCacheRoute = NO_CACHE_ROUTES.includes(pathname) ||
    NO_CACHE_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (isNoCacheRoute) {
    const response = NextResponse.next()

    // Set cache control to prevent edge caching
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('x-ideamatch-build', BUILD_SHA)
    response.headers.set('x-ideamatch-timestamp', BUILD_TIMESTAMP)

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
