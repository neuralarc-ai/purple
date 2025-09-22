'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
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

          // Check if user profile exists, create if not
          await ensureUserProfile(supabase, data.session.user)

          // Get return URL and redirect immediately
          const returnUrl = searchParams.get('returnUrl') || '/dashboard'
          router.push(returnUrl)
          
        } else {
          console.log('⏳ No session yet, waiting for auth state change...')
          
          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('🔔 Auth state change:', event)
              
              if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in via state change')
                
                await ensureUserProfile(supabase, session.user)
                
                const returnUrl = searchParams.get('returnUrl') || '/dashboard'
                router.push(returnUrl)
                
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

// Helper function to ensure user profile exists
async function ensureUserProfile(supabase: any, user: any) {
  try {
    console.log('🔍 Checking user profile for:', user.email)
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('📝 Creating user profile...')
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          preferred_name: user.user_metadata?.given_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          work_description: 'Professional',
          personal_references: null
        })

      if (insertError) {
        console.error('❌ Error creating user profile:', insertError)
      } else {
        console.log('✅ User profile created successfully')
      }
    } else if (profileError) {
      console.error('❌ Error checking user profile:', profileError)
    } else {
      console.log('✅ User profile already exists')
    }
  } catch (error) {
    console.error('❌ Error in ensureUserProfile:', error)
  }
}
