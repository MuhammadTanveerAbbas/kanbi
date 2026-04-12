import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Note: Using middleware for Supabase auth is the recommended approach
// The "proxy" pattern mentioned in Next.js docs is still experimental
// and not fully compatible with Supabase SSR yet

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/forgot', '/reset-password', '/pricing', '/features', '/privacy', '/terms']
const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot', '/reset-password']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session on every request (keeps JWT alive)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If logged in and trying to access auth pages → redirect to dashboard
  if (user && AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If NOT logged in and trying to access protected routes → redirect to sign-in
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!user && !isPublic && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
