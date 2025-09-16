'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AzureSignInProps {
  returnUrl?: string;
}

export default function AzureSignIn({ returnUrl }: AzureSignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleAzureSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Always use backend OAuth flow for Azure AD
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      // Remove /api suffix if it exists to avoid double /api
      const baseUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
      const response = await fetch(`${baseUrl}/api/azure/oauth/url`);
      
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
    } catch (error: any) {
      console.error('Azure sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Azure AD');
      setIsLoading(false);
    }
  };

  const initiateSupabaseOAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
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
      onClick={handleAzureSignIn}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.4 24H0V12.6H11.4V24ZM24 24H12.6V12.6H24V24ZM11.4 11.4H0V0H11.4V11.4ZM24 11.4H12.6V0H24V11.4Z"
          fill="#0078D4"
        />
      </svg>
      {isLoading ? 'Signing in...' : 'Continue with Microsoft'}
    </button>
  );
}
