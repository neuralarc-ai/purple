'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface InviteData {
  inviteCode: string;
  fullName: string;
  email: string;
  companyName: string;
}

export default function InvitePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData>({
    inviteCode: '',
    fullName: '',
    email: '',
    companyName: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Auth check - Session:', !!session, 'Error:', error);
        
        if (error) {
          console.error('Auth error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
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
            console.log('User already onboarded, redirecting to dashboard');
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
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
      // Get fresh session before making the request
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        toast.error('Please sign in to start your trial');
        router.push('/auth');
        return;
      }
      
      console.log('Starting trial with session:', !!session);
      
      const response = await fetch('/api/billing/create-trial-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/onboarding`,
          cancel_url: `${window.location.origin}/invite?trial=cancelled`,
        }),
      });

      const result = await response.json();
      
      console.log('Trial checkout response:', result);
      
      if (result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else if (result.status === 'existing_subscription') {
        // User already has subscription, redirect to onboarding
        toast.info('You already have an active subscription');
        router.push('/onboarding');
      } else {
        console.error('Trial checkout failed:', result);
        toast.error(result.error || 'Failed to create trial checkout. Please try again.');
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
    <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8 p-4">
            <Image
              src="/logo-dark.svg"
              alt="Helium Logo"
              width={120}
              height={120}
              className="w-12 h-12"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">
            Float into Helium – Early Access
          </h1>
          <p className="text-lg text-gray-600">
            Enter your invite code to unlock access. Don't have one? Join the waitlist to be first in line.
          </p>
        </div>

        {/* Two Card Layout */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Card - Invite Code */}
          <div className="bg-white h-[500px] sm:h-[550px] lg:h-[600px] flex flex-col justify-center items-center rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <h2 className="text-lg sm:text-xl font-bold text-black mb-2">Have an invite code?</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Enter your code to unlock access instantly.</p>
            </div>

            <div className="space-y-3 sm:space-y-4 w-full max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-sm font-medium text-black">
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
                  className="text-xl sm:text-2xl h-10 sm:h-12 text-center font-mono border-gray-200"
                />
                {inviteError && (
                  <p className="text-xs sm:text-sm text-red-600">{inviteError}</p>
                )}
              </div>

              <Button
                onClick={handleInviteSubmit}
                disabled={!inviteData.inviteCode.trim() || isSubmitting}
                className="w-full h-9 sm:h-10 bg-gray-800 hover:bg-gray-900 text-white text-sm sm:text-base"
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
                className="w-full h-9 sm:h-10 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm sm:text-base"
              >
                Join Waitlist
              </Button>
            </div>
          </div>

          {/* Right Card - Illustration and Trial */}
          <div className="bg-black rounded-2xl shadow-lg flex flex-col h-[500px] sm:h-[550px] lg:h-[600px] overflow-hidden">
            {/* Illustration - Full Size */}
            <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
              <div className="relative w-full h-full">
                <Image
                  src="/images/Benefit.png"
                  alt="Helium Benefits"
                  fill
                  className="object-contain rounded-lg"
                  priority
                />
              </div>
            </div>

            {/* Trial Button */}
            <div className="text-center p-3 sm:p-4">
              <Button
                className="w-full h-9 sm:h-10 bg-white text-black hover:bg-gray-100 font-semibold text-sm sm:text-base"
                onClick={isAuthenticated ? handleStartTrial : () => router.push('/auth')}
                disabled={isStartingTrial}
              >
                {isStartingTrial ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                    Starting trial...
                  </>
                ) : isAuthenticated ? (
                  'Start 1-week trial for $1.99'
                ) : (
                  'Sign in to start trial'
                )}
              </Button>
            </div>
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
