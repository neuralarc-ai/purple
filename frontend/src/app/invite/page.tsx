'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { TextEffect } from '@/components/ui/text-effect';

interface InviteData {
  inviteCode: string;
  fullName: string;
  email: string;
  companyName: string;
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [showTrialButton, setShowTrialButton] = useState(false);

  // Show trial button after text anim ation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTrialButton(true);
    }, 2000); // 2 seconds delay to allow text animation to complete

    return () => clearTimeout(timer);
  }, []);
  const [inviteData, setInviteData] = useState<InviteData>({
    inviteCode: '',
    fullName: '',
    email: '',
    companyName: '',
  });

  // Handle Azure OAuth success
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const azureSuccess = searchParams?.get('azure_success');
    const email = searchParams?.get('email');

    if (azureSuccess === 'true' && email) {
      console.log('🔄 Handling Azure OAuth success on invite page for:', email);
      
      // Show success message
      toast.success(`Welcome! Azure OAuth completed for ${email}`);
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('azure_success');
      newUrl.searchParams.delete('email');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        if (session?.access_token) {
          // Check if user has already completed onboarding
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (profileData && !profileError) {
            // User has already completed onboarding - redirect to dashboard
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const updateInviteData = (updates: Partial<InviteData>) => {
    setInviteData(prev => ({ ...prev, ...updates }));
  };

  const handleInviteSubmit = async () => {
    if (!inviteData.inviteCode.trim()) {
      setInviteError('Please enter an invite code');
      return;
    }

    setIsSubmitting(true);
    setInviteError('');

    try {
      const response = await fetch('/api/invite-codes/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invite_code: inviteData.inviteCode.trim(),
        }),
      });

      const result = await response.json();

      if (result.valid) {
        // Invite code is valid, show welcome modal
        toast.success('Invite code validated successfully!');
        setShowWelcomeModal(true);
      } else {
        setInviteError(result.message || 'Invalid invite code. Please try again or join the waitlist.');
      }
    } catch (error) {
      console.error('Invite validation error:', error);
      setInviteError('An error occurred while validating the invite code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!inviteData.fullName.trim() || !inviteData.email.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/invite-codes/join-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: inviteData.fullName.trim(),
          email: inviteData.email.trim(),
          ...(inviteData.companyName.trim() && { company_name: inviteData.companyName.trim() }),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setWaitlistSuccess(true);
        toast.success(result.message);
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowWaitlistModal(false);
          setWaitlistSuccess(false);
          setInviteData({ inviteCode: '', fullName: '', email: '', companyName: '' });
        }, 3000);
      } else {
        toast.error(result.message || 'Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      toast.error('An error occurred while joining the waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    
    try {
      // Check if user is authenticated first
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Authentication check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionError: sessionError?.message
      });
      
      if (!session?.access_token) {
        // User is not authenticated, redirect to sign-in
        console.log('User not authenticated, redirecting to sign-in');
        toast.info('Please sign in to start your trial');
        router.push('/auth?mode=signin&redirect=/invite');
        return;
      }

      // Ensure we have a valid user ID
      if (!session.user?.id) {
        console.log('Invalid user session, redirecting to sign-in');
        toast.error('Invalid user session. Please sign in again.');
        router.push('/auth?mode=signin&redirect=/invite');
        return;
      }

      // Only proceed if we're in browser
      if (typeof window === 'undefined') {
        toast.error('Please try again');
        return;
      }

      console.log('Starting trial checkout...', {
        success_url: `${window.location.origin}/onboarding`,
        cancel_url: `${window.location.origin}/invite?trial=cancelled`,
        origin: window.location.origin
      });

      const response = await fetch('/api/billing/create-trial-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/onboarding`,
          cancel_url: `${window.location.origin}/invite?trial=cancelled`,
        }),
      });

      console.log('Trial checkout response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('Trial checkout result:', result);
      
      if (result.url) {
        // Redirect to Stripe checkout
        console.log('Redirecting to Stripe checkout:', result.url);
        if (typeof window !== 'undefined') {
          window.location.href = result.url;
        }
      } else if (result.status === 'existing_subscription') {
        // User already has subscription, redirect to onboarding
        toast.info('You already have an active subscription');
        router.push('/onboarding');
      } else {
        console.error('No URL in response:', result);
        toast.error(result.error || result.message || 'Failed to create trial checkout. Please try again.');
      }
    } catch (error) {
      console.error('Trial checkout error:', error);
      toast.error('Failed to start trial. Please try again.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] flex flex-col lg:flex-row">
      {/* Left Side - Image with Logo Overlay (Mobile: full width, Desktop: 50%) */}
      <div className="w-full lg:w-[50%] h-[40vh] lg:h-auto relative">
        <Image
          src="/images/invitecard.png"
          alt="Helium Invite Card"
          fill
          className="object-cover"
          priority
        />
        {/* Logo Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center lg:justify-start pt-8 lg:pt-16 px-4 lg:px-8">
          <div className="flex justify-center mb-4 lg:mb-8">
            <Image
              src="/logo-dark.svg"
              alt="Helium Logo"
              width={120}
              height={120}
              className="w-12 h-12 lg:w-16 lg:h-16"
              priority
            />
          </div>
          <h1 className="text-xl lg:text-3xl font-bold text-white mb-2 lg:mb-4 text-center drop-shadow-lg px-4">
            Float into Helium – Early Access
          </h1>
          <p className="text-sm lg:text-lg text-white text-center drop-shadow-lg max-w-md px-4">
            Enter your invite code to unlock access. Don't have one? Join the waitlist to be first in line or have a trial.
          </p>
        </div>
      </div>

      {/* Right Side - Form and Animated Text (Mobile: full width, Desktop: 50%) */}
      <div className="w-full lg:w-[50%] bg-[#EDEDED] flex flex-col justify-center items-center p-4 lg:p-8 min-h-[60vh] lg:min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {/* Invite Code Form */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 w-full">
            <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Have an invite code?</h2>
            </div>

            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-base sm:text-lg font-medium text-black">
                  Invite Code
                </Label>
                <Input
                  id="inviteCode"
                  placeholder=""
                  value={inviteData.inviteCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 7).toUpperCase();
                    updateInviteData({ inviteCode: value });
                  }}
                  maxLength={7}
                  className="text-2xl sm:text-3xl h-10 sm:h-12 bg-white! text-black text-center font-mono"
                />
                {inviteError && (
                  <p className="text-xs sm:text-sm text-red-600">{inviteError}</p>
                )}
              </div>

              <div className="flex flex-col items-center space-y-3">
                <Button
                  onClick={handleInviteSubmit}
                  disabled={!inviteData.inviteCode.trim() || isSubmitting}
                  className="w-full sm:w-2/3 h-10 sm:h-9 bg-black hover:bg-black text-white text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    'Let\'s Float'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowWaitlistModal(true)}
                  className="w-full sm:w-2/3 h-10 sm:h-9 border border-gray-800 text-gray-600 bg-white text-sm sm:text-base"
                >
                  Join Waitlist
                </Button>
              </div>
            </div>
            </div>
          </div>

          {/* Animated Text */}
          <div className="text-center">
            <div className="text-black text-lg sm:text-2xl lg:text-3xl leading-tight text-center px-2 sm:px-4">
              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="div"
                className="block"
              >
                Missing an invite?
              </TextEffect>
              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="div"
                className="block"
              >
                Unlock a 7-day Helium trial for $1.99.
              </TextEffect>
            </div>
            
            {/* Trial Button - Only shows after text animation completes */}
            {showTrialButton && (
              <div className="mt-6 sm:mt-8">
                {!isAuthenticated && (
                  <div className="mb-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Sign in to unlock your 7-day trial
                    </p>
                  </div>
                )}
                <Button
                  className="w-full sm:w-2/3 h-10 sm:h-9 bg-white text-black hover:bg-gray-100 font-semibold text-sm sm:text-base border border-gray-300"
                  onClick={handleStartTrial}
                  disabled={isStartingTrial}
                >
                  {isStartingTrial ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                      Starting trial...
                    </>
                  ) : (
                    isAuthenticated ? 'Start trial' : 'Sign in to start trial'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-4xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Welcome to Helium!</DialogTitle>
          </DialogHeader>
          <div className="flex  ">
            {/* Left Section - Image */}
            <div className="flex-1 hidden md:block bg-gray-100 dark:bg-gray-800 rounded-l-3xl items-center justify-center">
              <Image
                src="/images/Benefit.png"
                alt="Helium Benefits"
                width={400}
                height={300}
                className="w-full h-full object-center rounded-l-3xl object-cover"
                priority
              />
            </div>

            {/* Right Section - Content */}
            <div className="flex-1 p-8 rounded-r-3xl bg-background">
              <div className="space-y-6">
                {/* Title */}
                <h2 className="text-3xl font-bold text-foreground">
                  Welcome to Helium!
                </h2>

                {/* Welcome Message */}
                <p className="text-muted-foreground text-lg">
                  You are part of our exclusive invite group, and we have prepared a special offer just for you:
                </p>

                {/* Benefits List */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      30% Off Annual Subscription:
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Renew your free one-month subscription within the first month to unlock half-price access for the entire year.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Team Sharing Included:
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Invite up to 3 team members to share this subscription with you.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Bonus Credits:
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Receive 10% extra credits every month for the whole year compared to the standard package.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWelcomeModal(false);
                      router.push('/onboarding');
                    }}
                    className="flex-1 hover:bg-transparent hover:text-current"
                  >
                    Remind me Later
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWelcomeModal(false);
                      router.push('/onboarding');
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled
                  >
                    Activate now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join the Helium Waitlist</DialogTitle>
          </DialogHeader>
          
          {waitlistSuccess ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">You're on the Helium list!</h3>
              <p className="text-muted-foreground">
                We'll notify you when it's your turn.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={inviteData.fullName}
                  onChange={(e) => updateInviteData({ fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={inviteData.email}
                  onChange={(e) => updateInviteData({ email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Company Name <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
                  value={inviteData.companyName}
                  onChange={(e) => updateInviteData({ companyName: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowWaitlistModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWaitlistSubmit}
                  disabled={!inviteData.fullName.trim() || !inviteData.email.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    'Join Waitlist'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  )
}
