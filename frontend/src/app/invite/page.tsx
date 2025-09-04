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
}

export default function InvitePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteData, setInviteData] = useState<InviteData>({
    inviteCode: '',
    fullName: '',
    email: '',
  });

  useEffect(() => {
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
            router.push('/dashboard');
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
        // Invite code is valid, proceed to onboarding
        toast.success('Invite code validated successfully!');
        router.push('/onboarding');
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
          setInviteData({ inviteCode: '', fullName: '', email: '' });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-16 p-4">
            <Image
              src="/logo-dark.svg"
              alt="Helium Logo"
              width={120}
              height={120}
              className="w-12 h-12"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Float into Helium – Early Access
          </h1>
          <p className="text-muted-foreground">
            Enter your invite code to unlock access. Don't have one? Join the waitlist to be first in line.
          </p>
        </div>

        {/* Invite Code Form */}
        <div className="mb-6">
          <div className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2 w-full mx-auto">
                <Label htmlFor="inviteCode" className="text-sm font-medium">
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
                  className="text-5xl! h-14 text-center font-mono"
                />
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
              </div>

              <Button
                onClick={handleInviteSubmit}
                disabled={!inviteData.inviteCode.trim() || isSubmitting}
                className="w-full h-12 mx-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-2 animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  'Let\'s Float'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 h-px bg-border"></div>
          <span className="px-4 text-sm text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Waitlist Button */}
        <Button
          variant="ghost"
          onClick={() => setShowWaitlistModal(true)}
          className="w-full h-12 border border-border"
        >
          Join Waitlist
        </Button>
      </div>

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
