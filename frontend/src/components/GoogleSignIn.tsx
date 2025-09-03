'use client';

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GoogleSignInProps {
  returnUrl?: string;
}

export default function GoogleSignIn({ returnUrl }: GoogleSignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Check if we need backend OAuth (for production with backend integration)
      const needsBackendOAuth = process.env.NODE_ENV === 'production' && 
                               process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (needsBackendOAuth) {
        // Use backend OAuth flow
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/auth/google/oauth/url`);
        
        if (response.ok) {
          const { auth_url } = await response.json();
          // Add returnUrl to the state parameter for backend to handle
          const stateParam = returnUrl ? `&state=${encodeURIComponent(returnUrl)}` : '';
          window.location.href = `${auth_url}${stateParam}`;
        } else {
          // Fallback to Supabase OAuth if backend OAuth fails
          console.warn('Backend OAuth not available, falling back to Supabase OAuth');
          await initiateSupabaseOAuth();
        }
      } else {
        // Use Supabase OAuth for localhost and when backend OAuth is not configured
        await initiateSupabaseOAuth();
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const initiateSupabaseOAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${
          returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
        }`,
      },
    });

    if (error) {
      throw error;
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full h-12 flex items-center border-gray-200 bg-white text-black justify-center text-sm font-medium tracking-wide rounded-full  border border-border   duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-sans"
      type="button"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FcGoogle className="w-4 h-4 mr-2" />
      )}
      <span className="font-medium">
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </span>
    </button>
  );
}