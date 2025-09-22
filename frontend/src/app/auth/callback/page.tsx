'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      try {
        console.log('🔄 Processing auth callback...')
        console.log('📍 Current URL:', window.location.href)

        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          router.push('/auth?error=callback_failed')
          return
        }

        if (data.session) {
          console.log('✅ Session found:', {
            userId: data.session.user.id,
            email: data.session.user.email,
            provider: data.session.user.app_metadata.provider
          })

          // Check if user is new or existing
          const redirectUrl = await checkUserOnboardingStatus(supabase, data.session.user.id)
          router.push(redirectUrl)
          
        } else {
          console.log('⏳ No session yet, waiting for auth state change...')
          
          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('🔔 Auth state change:', event)
              
              if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in via state change')
                
                // Check if user is new or existing
                const redirectUrl = await checkUserOnboardingStatus(supabase, session.user.id)
                router.push(redirectUrl)
                
                subscription.unsubscribe()
              } else if (event === 'SIGNED_OUT') {
                console.log('❌ User signed out')
                router.push('/auth?error=signed_out')
                subscription.unsubscribe()
              }
            }
          )

          // Set timeout to prevent infinite waiting
          setTimeout(() => {
            subscription.unsubscribe()
            router.push('/auth?error=timeout')
          }, 10000) // 10 second timeout
        }

      } catch (error: any) {
        console.error('❌ Auth callback error:', error)
        router.push('/auth?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  // Minimal loading UI - just a simple spinner
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}

// Helper function to check user onboarding status
async function checkUserOnboardingStatus(supabase: any, userId: string) {
  try {
    console.log('🔍 Checking user onboarding status for:', userId)
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // No profile found - user needs invite code validation
      console.log('🆕 New user detected, redirecting to invite')
      return '/invite'
    } else if (profileError) {
      console.error('❌ Error checking user profile:', profileError)
      // On error, redirect to dashboard as fallback
      return '/dashboard'
    } else if (profileData) {
      // User has profile - redirect to dashboard
      console.log('✅ Existing user detected, redirecting to dashboard')
      return '/dashboard'
    }
  } catch (error) {
    console.error('❌ Error checking user onboarding status:', error)
  }
  
  // Fallback to dashboard
  return '/dashboard'
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
