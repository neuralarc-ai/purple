'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AzureSignInProps {
  returnUrl?: string;
  className?: string;
}

export default function AzureSignIn({ returnUrl, className }: AzureSignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('🚀 Starting Microsoft OAuth flow...');
      console.log('📍 Redirect URL:', redirectUrl);
      console.log('🔄 Return URL:', returnUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: redirectUrl,
          queryParams: returnUrl ? { returnUrl } : undefined,
          scopes: 'openid profile email'
        }
      });

      if (error) {
        console.error('❌ Microsoft OAuth error:', error);
        toast.error(error.message || 'Failed to sign in with Microsoft');
        setIsLoading(false);
        return;
      }

      console.log('✅ OAuth flow initiated:', data);
      // Don't set loading to false - user will be redirected
      
    } catch (error: any) {
      console.error('❌ Microsoft sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Microsoft');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleMicrosoftSignIn}
      disabled={isLoading}
      className={`w-full h-12 flex items-center border-gray-200 bg-white text-black justify-center text-sm font-medium tracking-wide rounded-full border duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-sans ${className || ''}`}
      type="button"
    >
      {isLoading ? (
        <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      ) : (
        <svg
          className="w-4 h-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.4 24H0V12.6H11.4V24ZM24 24H12.6V12.6H24V24ZM11.4 11.4H0V0H11.4V11.4ZM24 11.4H12.6V0H24V11.4Z"
            fill="#0078D4"
          />
        </svg>
      )}
      <span className="font-medium">
        {isLoading ? 'Signing in...' : 'Continue with Microsoft'}
      </span>
    </button>
  );
}