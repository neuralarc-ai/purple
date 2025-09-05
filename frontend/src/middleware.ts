import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  // This refreshes the Auth token and is required for server-side auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/agents', '/projects', '/settings', '/invitation']
  const authRoutes = ['/auth', '/login', '/signup']
  const onboardingRoute = '/onboarding'
  const inviteRoute = '/invite'
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isOnboardingRoute = request.nextUrl.pathname === onboardingRoute
  const isInviteRoute = request.nextUrl.pathname === inviteRoute
  
  // Check if user is accessing the root path (homepage)
  const isRootPath = request.nextUrl.pathname === '/'
  
  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    // Check if user has completed onboarding
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // No profile found - user needs invite code validation
        return NextResponse.redirect(new URL('/invite', request.url))
      } else if (profileData) {
        // User has profile - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error checking user profile in middleware:', error)
      // On error, redirect to dashboard as fallback
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Handle onboarding route access
  if (isOnboardingRoute && user) {
    // Check if user has already completed onboarding
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileData && !profileError) {
        // User has already completed onboarding - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error checking user profile in middleware:', error)
      // On error, allow access to onboarding
    }
  }

  // Redirect unauthenticated users from onboarding
  if (isOnboardingRoute && !user) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Handle invite route access
  if (isInviteRoute && user) {
    // Check if user has already completed onboarding
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileData && !profileError) {
        // User has already completed onboarding - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error checking user profile in middleware:', error)
      // On error, allow access to invite
    }
  }

  // Redirect unauthenticated users from invite
  if (isInviteRoute && !user) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 