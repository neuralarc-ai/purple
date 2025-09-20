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

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Microsoft sign-in error:', error);
        toast.error(error.message || 'Failed to sign in with Microsoft');
        setIsLoading(false);
      }
      // Note: Don't set isLoading to false here as the user will be redirected
      
    } catch (error: any) {
      console.error('Microsoft sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Microsoft');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleMicrosoftSignIn}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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