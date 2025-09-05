'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper";
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Mail, 
  Shield, 
  FileText,
  Users,
  Building,
  Briefcase,
  TrendingUp,
  Search,
  Share2,
  Calendar,
  Newspaper,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface OnboardingData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  displayName: string;
  role: string;
  otherRole: string; // Add field for custom role input
  referralSource: string;
  otherReferral: string; // Add field for custom referral input
  showPrivacy: boolean; // Add field for toggling between Terms and Privacy
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
  { id: 'legal', name: 'Because your trust deserves clarity.', icon: <FileText className="h-4 w-4" /> },
  { id: 'name', name: 'Let\'s start simple—your name?', icon: <User className="h-4 w-4" /> },
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
  const [data, setData] = useState<OnboardingData>({
    termsAccepted: false,
    privacyAccepted: false,
    displayName: '',
    role: '',
    otherRole: '',
    referralSource: '',
    otherReferral: '',
    showPrivacy: false,
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
        // Send welcome email
        try {
          console.log('Sending welcome email...');
          const emailResponse = await fetch('/api/user-profiles/send-welcome-email', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              display_name: data.displayName.trim(),
            }),
          });

          if (emailResponse.ok) {
            const emailResult = await emailResponse.json();
            console.log('Welcome email sent successfully:', emailResult);
          } else {
            console.warn('Failed to send welcome email, but onboarding completed');
          }
        } catch (emailError) {
          console.warn('Error sending welcome email:', emailError);
          // Don't fail onboarding if email fails
        }

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
          <div className="flex gap-8">
            {/* Left Card - Privacy Policy */}
            <Card className="flex-1 p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={data.privacyAccepted}
                    onCheckedChange={(checked) => updateData({ privacyAccepted: !!checked })}
                  />
                  <CardTitle className="text-xl">
                    I accept the Privacy Policy
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-4 text-sm">
                  <p>
                    This Privacy Policy describes how Helium ("we", "our", or "us") collects, uses, and shares your information when you use our platform.
                  </p>
                  <div>
                    <h3 className="font-semibold">Information We Collect</h3>
                    <p>
                      We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">How We Use Your Information</h3>
                    <p>
                      We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure security.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Information Sharing</h3>
                    <p>
                      We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Data Security</h3>
                    <p>
                      We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Your Rights</h3>
                    <p>
                      You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact</h3>
                    <p>
                      For privacy-related questions, contact us at: {" "}
                      <a
                        href="mailto:privacy@neuralarc.ai"
                        className="text-primary hover:underline"
                      >
                        privacy@neuralarc.ai
                      </a>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                    Last updated: May, 2025
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Card - Terms of Use */}
            <Card className="flex-1 p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                <Checkbox
                  id="terms"
                  checked={data.termsAccepted}
                  onCheckedChange={(checked) => updateData({ termsAccepted: !!checked })}
                />
                  <CardTitle className="text-xl">
                    I accept the Terms of Service
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-4 text-sm">
                  <p>
                    Welcome to Helium. By accessing or using https://he2.ai (the "Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.
                  </p>
                  <div>
                    <h3 className="font-semibold">Use of Platform</h3>
                    <p>
                      The Platform is provided for informational and experimental purposes only. You agree to use it in compliance with all applicable laws and regulations.
                  </p>
                </div>
                  <div>
                    <h3 className="font-semibold">User Content</h3>
                    <p>
                      You are responsible for any content you input or generate using the Platform. Do not submit unlawful, harmful, or infringing content.
                    </p>
              </div>
                  <div>
                    <h3 className="font-semibold">Intellectual Property</h3>
                    <p>
                      All content, trademarks, and intellectual property on the Platform are owned by Helium and its licensors. You may not copy, reproduce, or distribute any part of the Platform without permission.
                  </p>
                </div>
                  <div>
                    <h3 className="font-semibold">Disclaimer of Warranties</h3>
                    <p>
                      The Platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or output.
                    </p>
              </div>
                  <div>
                    <h3 className="font-semibold">Limitation of Liability</h3>
                    <p>
                      We are not liable for any damages arising from your use of the Platform, including direct, indirect, incidental, or consequential damages.
                    </p>
            </div>
                  <div>
                    <h3 className="font-semibold">Changes to Terms</h3>
                    <p>
                      We may update these Terms of Use at any time. Continued use of the Platform constitutes acceptance of the revised terms.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact</h3>
                    <p>
                      For questions, contact us at: {" "}
                      <a
                        href="mailto:support@neuralarc.ai"
                        className="text-primary hover:underline"
                      >
                        support@neuralarc.ai
                      </a>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                    Last updated: May, 2025
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="text-left max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-8">
            Let's start simple—your name?
            </h2>
            <div className="flex justify-start">
                              <Input
                  id="displayName"
                  placeholder="Enter your name"
                  value={data.displayName}
                  onChange={(e) => updateData({ displayName: e.target.value })}
                  className="text-xl h-16 w-80"
                />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-8">
            Where do you fit in?
            </h2>
            <div className="grid grid-cols-4 gap-3 max-w-4xl mx-auto">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    role.id === 'other' && data.role === 'other' 
                      ? "" 
                      : cn(
                          "hover:shadow-md rounded-lg border",
                          data.role === role.id ? "border-primary bg-primary/5" : "border-border bg-card"
                        )
                  )}
                  onClick={() => updateData({ role: role.id })}
                >
                  {role.id === 'other' && data.role === 'other' ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Label htmlFor="otherRole" className="text-sm font-medium text-center mb-2 text-foreground">
                  Please specify your role <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="otherRole"
                  placeholder="Enter your role or job title"
                  value={data.otherRole}
                  onChange={(e) => updateData({ otherRole: e.target.value })}
                        className="text-base h-12 w-full"
                        onClick={(e) => e.stopPropagation()}
                />
              </div>
                  ) : (
                    <div className="p-2 flex flex-col items-center space-y-1">
                      <div className="text-muted-foreground">
                        {role.icon}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-center text-foreground">{role.name}</span>
                        {data.role === role.id && (
                          <CheckCircle2 className="h-3 w-3 text-helium-green flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-8">
              How did you find us?
            </h2>
            <div className="grid grid-cols-4 gap-3 max-w-4xl mx-auto">
              {referralSources.map((source, index) => (
                <div
                  key={source.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    source.id === 'other' && data.referralSource === 'other' 
                      ? "" 
                      : cn(
                          "hover:shadow-md rounded-lg border",
                          data.referralSource === source.id ? "border-primary bg-primary/5" : "border-border bg-card"
                        ),
                    // Center the last item (Others) below Social Media and News
                    index === referralSources.length - 1 && referralSources.length % 4 !== 0 ? "col-start-2 col-span-2" : ""
                  )}
                  onClick={() => updateData({ referralSource: source.id })}
                >
                  {source.id === 'other' && data.referralSource === 'other' ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Label htmlFor="otherReferral" className="text-sm font-medium text-center mb-2 text-foreground">
                        Please specify <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="otherReferral"
                        placeholder="Enter how you found us"
                        value={data.otherReferral || ''}
                        onChange={(e) => updateData({ otherReferral: e.target.value })}
                        className="text-base h-12 w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div className="p-2 flex flex-col items-center space-y-1">
                      <div className="text-muted-foreground">
                        {source.icon}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-center text-foreground">{source.name}</span>
                      {data.referralSource === source.id && (
                          <CheckCircle2 className="h-3 w-3 text-helium-green flex-shrink-0" />
                      )}
                    </div>
                    </div>
                  )}
                </div>
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Helium
            </h1>
            <p className="text-muted-foreground">
              Let's get you set up in just a few steps
            </p>
          </div>

          {/* Stepper */}
        <div className="mb-12 mt-16 flex justify-center">
          <Stepper value={currentStep + 1} className="max-w-xl">
              {steps.map((step, index) => (
              <StepperItem key={step.id} step={index + 1} className="not-last:flex-1">
                  <StepperTrigger asChild>
                  <StepperIndicator className="w-8 h-8 text-sm" />
                  </StepperTrigger>
                {index < steps.length - 1 && <StepperSeparator />}
                </StepperItem>
              ))}
            </Stepper>
          </div>

        {/* Content - Centered */}
        <div className="flex-1 flex flex-col justify-center min-h-[50vh]">
              {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 h-12">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center justify-center px-3 py-2 text-sm rounded-md h-10 hover:bg-sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm rounded-md h-10"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm rounded-md h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
