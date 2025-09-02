'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

interface OnboardingData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  displayName: string;
  role: string;
  otherRole: string; // Add field for custom role input
  referralSource: string;
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
  const [data, setData] = useState<OnboardingData>({
    termsAccepted: false,
    privacyAccepted: false,
    displayName: '',
    role: '',
    otherRole: '',
    referralSource: '',
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Helium</h1>
          <p className="text-muted-foreground mt-2">
            Let's get you set up in just a few steps
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-[14px] h-[2px] bg-muted-foreground/20 -z-10" />
            <div 
              className="absolute left-0 top-[14px] h-[2px] bg-primary -z-10 transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
            
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className="bg-background p-1 rounded-full">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted && "bg-primary text-primary-foreground",
                        isCurrent && "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/20",
                        isUpcoming && "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 flex items-center justify-center">
                          {step.icon}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-medium transition-all duration-300 text-center max-w-20",
                    isCompleted && "text-foreground",
                    isCurrent && "text-primary font-semibold",
                    isUpcoming && "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[currentStep].icon}
              {steps[currentStep].name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
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
                <ChevronRight className="h-4 w-4" />
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
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}
