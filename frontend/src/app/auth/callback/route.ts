import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('returnUrl') ?? '/dashboard'
  const success = searchParams.get('success')
  const email = searchParams.get('email')
  
  // Use configured URL instead of parsed origin to avoid 0.0.0.0 issues in self-hosted environments
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle backend OAuth success
  if (success === 'google_oauth_success' && email) {
    console.log('✅ Backend Google OAuth successful for:', email)
    // Redirect to the specified return URL
    return NextResponse.redirect(`${baseUrl}${next}`)
  }

  if (success === 'azure_oauth_success' && email) {
    console.log('✅ Backend Azure AD OAuth successful for:', email)
    // For Azure AD, always redirect to invite page to follow the same flow as Google
    return NextResponse.redirect(`${baseUrl}/invite`)
  }

  if (error) {
    console.error('❌ Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error)
        return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error.message)}`)
      }

      // Check if user has completed onboarding
      if (data.user) {
        try {
          // Check if user has a profile (indicating they've completed onboarding)
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', data.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // No profile found - user needs invite code validation
            console.log('🆕 New user detected, redirecting to invite')
            return NextResponse.redirect(`${baseUrl}/invite`)
          } else if (profileError) {
            console.error('❌ Error checking user profile:', profileError)
            // On error, redirect to dashboard as fallback
            return NextResponse.redirect(`${baseUrl}${next}`)
          } else if (profileData) {
            // User has profile - redirect to dashboard
            console.log('✅ Existing user detected, redirecting to dashboard')
            return NextResponse.redirect(`${baseUrl}${next}`)
          }
        } catch (profileCheckError) {
          console.error('❌ Error checking user profile:', profileCheckError)
          // On error, redirect to dashboard as fallback
          return NextResponse.redirect(`${baseUrl}${next}`)
        }
      }

      // Fallback redirect
      return NextResponse.redirect(`${baseUrl}${next}`)
    } catch (error) {
      console.error('❌ Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${baseUrl}/auth?error=unexpected_error`)
    }
  }
  return NextResponse.redirect(`${baseUrl}/auth`)
}
