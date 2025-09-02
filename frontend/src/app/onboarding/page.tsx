'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Briefcase, Search, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Shield, 
  Users,
  Building,
  TrendingUp,
  Share2,
  Calendar,
  Newspaper,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface OnboardingData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  displayName: string;
  role: string;
  otherRole: string; // Add field for custom role input
  referralSource: string;
}

interface InviteData {
  inviteCode: string;
  fullName: string;
  email: string;
}

const roles = [
  { id: 'product-management', name: 'Product Management', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'engineering', name: 'Engineering', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'hr', name: 'HR', icon: <Users className="h-5 w-5" /> },
  { id: 'finance', name: 'Finance', icon: <Building className="h-5 w-5" /> },
  { id: 'marketing', name: 'Marketing', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'sales', name: 'Sales', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'operations', name: 'Operations', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'data-science', name: 'Data Science', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'design', name: 'Design', icon: <Users className="h-5 w-5" /> },
  { id: 'legal', name: 'Legal', icon: <FileText className="h-5 w-5" /> },
  { id: 'other', name: 'Other', icon: <MoreHorizontal className="h-5 w-5" /> },
];

const referralSources = [
  { id: 'event', name: 'Event', icon: <Calendar className="h-4 w-4" /> },
  { id: 'social-media', name: 'Social Media', icon: <Share2 className="h-4 w-4" /> },
  { id: 'news', name: 'News', icon: <Newspaper className="h-4 w-4" /> },
  { id: 'search', name: 'Search', icon: <Search className="h-4 w-4" /> },
  { id: 'others', name: 'Others', icon: <MoreHorizontal className="h-4 w-4" /> },
];

const steps = [
  { id: 'legal', name: 'Legal & Email', icon: <FileText className="h-4 w-4" /> },
  { id: 'name', name: 'Your Name', icon: <User className="h-4 w-4" /> },
  { id: 'role', name: 'Your Role', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'referral', name: 'How did you find us?', icon: <Search className="h-4 w-4" /> },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showInviteStep, setShowInviteStep] = useState(true);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [data, setData] = useState<OnboardingData>({
    termsAccepted: false,
    privacyAccepted: false,
    displayName: '',
    role: '',
    otherRole: '',
    referralSource: '',
  });
  const [inviteData, setInviteData] = useState<InviteData>({
    inviteCode: '',
    fullName: '',
    email: '',
  });

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
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
            setHasCompletedOnboarding(true);
            // Redirect to dashboard if already completed onboarding
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Auth/onboarding check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

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
        setShowInviteStep(false);
        setCurrentStep(0);
        toast.success('Invite code validated successfully!');
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

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Legal & Email
        return data.termsAccepted && data.privacyAccepted;
      case 1: // Name
        return data.displayName.trim().length > 0;
      case 2: // Role
        return data.role !== '' && (data.role !== 'other' || data.otherRole.trim().length > 0);
      case 3: // Referral
        return data.referralSource !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Get the selected role name instead of ID
      const selectedRole = roles.find(role => role.id === data.role);
      const roleName = data.role === 'other' ? data.otherRole.trim() : (selectedRole ? selectedRole.name : data.role);

      console.log('Submitting onboarding data:', {
        terms_accepted: data.termsAccepted,
        privacy_accepted: data.privacyAccepted,
        display_name: data.displayName.trim(),
        role: roleName,
        referral_source: data.referralSource,
      });

      const response = await fetch('/api/user-profiles/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terms_accepted: data.termsAccepted,
          privacy_accepted: data.privacyAccepted,
          display_name: data.displayName.trim(),
          role: roleName,
          referral_source: data.referralSource,
        }),
      });

      console.log('Frontend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Frontend error response:', errorText);
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Frontend success response:', result);
      
      if (result.success) {
        // Redirect to dashboard
        console.log('Onboarding completed successfully, redirecting to dashboard');
        window.location.href = '/dashboard';
      } else {
        throw new Error(result.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      // Handle error - you might want to show a toast notification
      alert(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={data.termsAccepted}
                  onCheckedChange={(checked) => updateData({ termsAccepted: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-sm font-medium">
                    I accept the Terms of Service
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By accepting, you agree to our terms and conditions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={data.privacyAccepted}
                  onCheckedChange={(checked) => updateData({ privacyAccepted: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="privacy" className="text-sm font-medium">
                    I accept the Privacy Policy
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    We respect your privacy and protect your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Before we get started, what should I call you?
              </Label>
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={data.displayName}
                onChange={(e) => updateData({ displayName: e.target.value })}
                className="text-lg"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    data.role === role.id && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => updateData({ role: role.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-muted-foreground">
                        {role.icon}
                      </div>
                      <span className="text-sm font-medium">{role.name}</span>
                      {data.role === role.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Custom role input when "Other" is selected */}
            {data.role === 'other' && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="otherRole" className="text-sm font-medium">
                  Please specify your role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="otherRole"
                  placeholder="Enter your role or job title"
                  value={data.otherRole}
                  onChange={(e) => updateData({ otherRole: e.target.value })}
                  className="text-lg"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {referralSources.map((source) => (
                <Card
                  key={source.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    data.referralSource === source.id && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => updateData({ referralSource: source.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-muted-foreground">
                        {source.icon}
                      </div>
                      <span className="text-sm font-medium">{source.name}</span>
                      {data.referralSource === source.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-300" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-300" />
          <p className="text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Please sign in to complete the onboarding process.
            </p>
            <Button onClick={() => router.push('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation step if not authenticated or if invite step is active
  if (showInviteStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Float into Helium – Early Access
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your invite code to unlock access. Don't have one? Join the waitlist to be first in line.
            </p>
          </div>

          {/* Invite Code Form */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-sm font-medium">
                    Invite Code
                  </Label>
                  <Input
                    id="inviteCode"
                    placeholder="Enter your invite code"
                    value={inviteData.inviteCode}
                    onChange={(e) => updateInviteData({ inviteCode: e.target.value })}
                    className="text-lg"
                  />
                  {inviteError && (
                    <p className="text-sm text-red-500">{inviteError}</p>
                  )}
                </div>

                <Button
                  onClick={handleInviteSubmit}
                  disabled={!inviteData.inviteCode.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    'Let\'s Float'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Waitlist Button */}
          <Button
            variant="outline"
            onClick={() => setShowWaitlistModal(true)}
            className="w-full"
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
                <h3 className="text-lg font-semibold mb-2">You're on the Helium list!</h3>
                <p className="text-gray-600 dark:text-gray-300">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Helium
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Let's get you set up with your personalized experience
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-8 flex justify-center">
            <Stepper value={currentStep} onValueChange={setCurrentStep} className="w-full max-w-2xl">
              {steps.map((step, index) => (
                <StepperItem
                  key={step.id}
                  step={index}
                  className="flex-1"
                >
                  <StepperTrigger asChild>
                    <div className="flex flex-col items-center space-y-2 cursor-pointer">
                      <StepperIndicator className="w-12 h-12 bg-gray-200 dark:bg-gray-700 data-[state=active]:bg-primary data-[state=completed]:bg-primary">
                        <div className="flex items-center justify-center w-full h-full">
                          {step.icon}
                        </div>
                      </StepperIndicator>
                      <StepperTitle className="text-xs font-medium text-gray-600 dark:text-gray-300 data-[state=active]:text-primary data-[state=completed]:text-primary">
                        {step.name}
                      </StepperTitle>
                    </div>
                  </StepperTrigger>
                  {index < steps.length - 1 && <StepperSeparator className="bg-gray-200 dark:bg-gray-700 data-[state=completed]:bg-primary" />}
                </StepperItem>
              ))}
            </Stepper>
          </div>

          {/* Content */}
          <Card className="max-w-2xl mx-auto mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                {steps[currentStep].icon}
                {steps[currentStep].name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-center mt-4 max-w-2xl mx-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
