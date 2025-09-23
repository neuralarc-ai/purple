'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthTokens = async () => {
      try {
        // Get tokens from URL hash
        const hash = window.location.hash.substring(1); // Remove the #
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const tokenType = params.get('token_type');
        const expiresAt = params.get('expires_at');
        const expiresIn = params.get('expires_in');
        const type = params.get('type');

        console.log('🔍 Auth tokens found:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          tokenType,
          expiresAt,
          expiresIn,
          type
        });

        if (accessToken && refreshToken) {
          console.log('🔄 Setting Supabase session...');
          
          const supabase = createClient();
          
          // Set the session using the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('❌ Error setting session:', error);
            router.push('/auth?error=session_error');
            return;
          }

          console.log('✅ Session set successfully:', data.user?.email);

          if (data.user) {
            // Check if user has completed onboarding
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', data.user.id)
                .single();

              if (profileError && profileError.code === 'PGRST116') {
                // No profile found - user needs invite code validation
                console.log('🆕 New user detected, redirecting to invite');
                router.push('/invite');
              } else if (profileError) {
                console.error('❌ Error checking user profile:', profileError);
                // On error, redirect to dashboard as fallback
                router.push('/dashboard');
              } else if (profileData) {
                // User has profile - redirect to dashboard
                console.log('✅ Existing user detected, redirecting to dashboard');
                router.push('/dashboard');
              }
            } catch (profileCheckError) {
              console.error('❌ Error checking user profile:', profileCheckError);
              // On error, redirect to dashboard as fallback
              router.push('/dashboard');
            }
          } else {
            console.log('❌ No user data in session');
            router.push('/auth?error=no_user');
          }
        } else {
          console.log('❌ No auth tokens found in URL');
          router.push('/auth?error=no_tokens');
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth handler:', error);
        router.push('/auth?error=unexpected_error');
      }
    };

    handleAuthTokens();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
