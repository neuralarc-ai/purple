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
  { id: 'ceo', name: 'CEO', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg> },
  { id: 'founder', name: 'Founder', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M2.00488 19H22.0049V21H2.00488V19ZM2.00488 5L7.00488 8.5L12.0049 2L17.0049 8.5L22.0049 5V17H2.00488V5ZM4.00488 8.84131V15H20.0049V8.84131L16.5854 11.2349L12.0049 5.28024L7.42435 11.2349L4.00488 8.84131Z"></path></svg> },
  { id: 'product-management', name: 'Product Management', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { id: 'engineering', name: 'Engineering', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'hr', name: 'HR', icon: <Users className="h-5 w-5" /> },
  { id: 'finance', name: 'Finance', icon: <Building className="h-5 w-5" /> },
  { id: 'marketing', name: 'Marketing', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'sales', name: 'Sales', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path></svg> },
  { id: 'operations', name: 'Operations', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg> },
  { id: 'data-science', name: 'Data Science', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M10 22v-5"/><path d="M14 19v-2"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M18 20v-3"/><path d="M2 13h20"/><path d="M20 13V7l-5-5H6a2 2 0 0 0-2 2v9"/><path d="M6 20v-3"/></svg> },
  { id: 'design', name: 'Design', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M5 8V20H9V8H5ZM3 7L7 2L11 7V22H3V7ZM19 16V14H16V12H19V10H17V8H19V6H15V20H19V18H17V16H19ZM14 4H20C20.5523 4 21 4.44772 21 5V21C21 21.5523 20.5523 22 20 22H14C13.4477 22 13 21.5523 13 21V5C13 4.44772 13.4477 4 14 4Z"></path></svg> },
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
  { id: 'legal', name: 'Terms', icon: <FileText className="h-4 w-4" /> },
  { id: 'name', name: 'Name', icon: <User className="h-4 w-4" /> },
  { id: 'role', name: 'Role', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'referral', name: 'Reference', icon: <Search className="h-4 w-4" /> },
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

      // console.log('Submitting onboarding data:', {
      //   terms_accepted: data.termsAccepted,
      //   privacy_accepted: data.privacyAccepted,
      //   display_name: data.displayName.trim(),
      //   role: roleName,
      //   referral_source: data.referralSource,
      // });

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

      // console.log('Frontend response status:', response.status);

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
      // console.log('Frontend success response:', result);
      
      if (result.success) {
        // Send welcome email
        try {
          // console.log('Sending welcome email...');
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
            // console.log('Welcome email sent successfully:', emailResult);
          } else {
            console.warn('Failed to send welcome email, but onboarding completed');
          }
        } catch (emailError) {
          console.warn('Error sending welcome email:', emailError);
          // Don't fail onboarding if email fails
        }

        // Redirect to dashboard
        // console.log('Onboarding completed successfully, redirecting to dashboard');
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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Card - Privacy Policy */}
            <Card className="flex-1 bg-card rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-6 p-8">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Checkbox
                        id="privacy"
                        checked={data.privacyAccepted}
                        onCheckedChange={(checked) => updateData({ privacyAccepted: !!checked })}
                        className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                  <CardTitle className="text-xl font-semibold text-foreground tracking-wide">
                    I accept the Privacy Policy
                    </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto px-8 pb-8">
                <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
                  <p>
                      This Privacy Policy describes how Helium ("we", "our", or "us") collects, uses, and shares your information when you use our platform.
                  </p>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Information We Collect</h3>
                    <p>
                      We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">How We Use Your Information</h3>
                    <p>
                        We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure security.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Information Sharing</h3>
                    <p>
                        We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Data Security</h3>
                    <p>
                        We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Your Rights</h3>
                    <p>
                        You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.
                      </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Contact</h3>
                    <p>
                      For privacy-related questions, contact us at: {" "}
                      <a
                        href="mailto:privacy@neuralarc.ai"
                        className="text-primary hover:underline font-medium"
                      >
                        privacy@neuralarc.ai
                      </a>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-6 border-t border-border">
                    Last updated: May, 2025
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Card - Terms of Use */}
            <Card className="flex-1 bg-card rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-6 p-8">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Checkbox
                        id="terms"
                        checked={data.termsAccepted}
                        onCheckedChange={(checked) => updateData({ termsAccepted: !!checked })}
                        className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                  <CardTitle className="text-xl font-semibold text-foreground tracking-wide">
                    I accept the Terms of Service
                    </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto px-8 pb-8">
                <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
                  <p>
                      Welcome to Helium. By accessing or using https://he2.ai (the "Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.
                    </p>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Use of Platform</h3>
                    <p>
                        The Platform is provided for informational and experimental purposes only. You agree to use it in compliance with all applicable laws and regulations.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">User Content</h3>
                    <p>
                        You are responsible for any content you input or generate using the Platform. Do not submit unlawful, harmful, or infringing content.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Intellectual Property</h3>
                    <p>
                        All content, trademarks, and intellectual property on the Platform are owned by Helium and its licensors. You may not copy, reproduce, or distribute any part of the Platform without permission.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Disclaimer of Warranties</h3>
                    <p>
                        The Platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or output.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Limitation of Liability</h3>
                    <p>
                        We are not liable for any damages arising from your use of the Platform, including direct, indirect, incidental, or consequential damages.
                      </p>
                    </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Changes to Terms</h3>
                    <p>
                        We may update these Terms of Use at any time. Continued use of the Platform constitutes acceptance of the revised terms.
                      </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Contact</h3>
                    <p>
                      For questions, contact us at: {" "}
                      <a
                        href="mailto:support@neuralarc.ai"
                        className="text-primary hover:underline font-medium"
                      >
                        support@neuralarc.ai
                      </a>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-6 border-t border-border">
                    Last updated: May, 2025
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-semibold text-foreground mb-12 tracking-wide">
                What should Helium call you?
              </h2>
            <div className="flex justify-center">
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={data.displayName}
                onChange={(e) => updateData({ displayName: e.target.value })}
                className="text-xl h-16 w-full max-w-md bg-background text-foreground placeholder-muted-foreground rounded-2xl px-6"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center ">
            <h2 className="text-3xl font-semibold text-foreground mb-12 tracking-wide">
                Where do you fit in?
              </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    role.id === 'other' && data.role === 'other' 
                      ? "" 
                      : cn(
                          "hover:shadow-lg rounded-full px-4 py-2 bg-card hover:bg-card/80",
                          data.role === role.id ? "text-foreground shadow-lg" : "text-foreground"
                        )
                  )}
                  onClick={() => updateData({ role: role.id })}
                >
                  {role.id === 'other' && data.role === 'other' ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Label htmlFor="otherRole" className="text-sm font-medium text-center mb-3 text-foreground">
                  Please specify your role <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="otherRole"
                          placeholder="Enter your role or job title"
                          value={data.otherRole}
                          onChange={(e) => updateData({ otherRole: e.target.value })}
                        className="text-base h-12 w-full bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="text-muted-foreground">
                        {role.icon}
                      </div>
                      <span className="text-sm font-medium text-center">{role.name}</span>
                      {data.role === role.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
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
            <h2 className="text-3xl font-semibold text-foreground mb-12 tracking-wide">
                How did you find us?
              </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
              {referralSources.map((source) => (
                <div
                  key={source.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    source.id === 'other' && data.referralSource === 'other' 
                      ? "" 
                      : cn(
                          "hover:shadow-lg rounded-full px-4 py-2 bg-card hover:bg-card/80",
                          data.referralSource === source.id ? "text-foreground shadow-lg" : "text-foreground"
                        )
                  )}
                  onClick={() => updateData({ referralSource: source.id })}
                >
                  {source.id === 'other' && data.referralSource === 'other' ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Label htmlFor="otherReferral" className="text-sm font-medium text-center mb-3 text-foreground">
                        Please specify <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="otherReferral"
                          placeholder="Enter how you found us"
                          value={data.otherReferral || ''}
                          onChange={(e) => updateData({ otherReferral: e.target.value })}
                        className="text-base h-12 w-full bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="text-muted-foreground">
                        {source.icon}
                      </div>
                      <span className="text-sm font-medium text-center">{source.name}</span>
                      {data.referralSource === source.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
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
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            
            <h1 className="text-5xl font-bold text-foreground mb-2">
              Welcome to Helium
            </h1>
            <p className="text-muted-foreground text-2xl">
              Let's get you set up in just a few steps
            </p>
          </div>

          {/* Stepper */}
        <div className="mb-16 mt-16 flex justify-center">
          <div className="flex items-center space-x-8 max-w-4xl">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className={cn(
                    "px-6 py-3 rounded-full text-base font-medium transition-all duration-300 hover:scale-105",
                    currentStep === index 
                      ? "bg-primary text-primary-foreground shadow-lg scale-110 font-semibold" 
                      : currentStep > index
                      ? "bg-muted text-muted-foreground shadow-md"
                      : "bg-card text-muted-foreground hover:bg-card/80"
                  )}>
                    {step.name}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-border" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content - Centered */}
        <div className="flex-1 flex flex-col justify-center min-h-[50vh] gap-8">
              {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 gap-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center justify-center px-6 py-3 text-sm rounded-full transition-all duration-300 hover:translate-y-[-2px] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-4">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-sm rounded-full font-medium hover:translate-y-[-2px] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-sm rounded-full font-medium hover:translate-y-[-2px] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg hover:shadow-xl"
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
