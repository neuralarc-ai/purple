'use client';

import * as React from 'react';
import { useState } from 'react';
import { 
  User, 
  Settings, 
  Zap, 
  HelpCircle, 
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/AuthProvider';
import { useUserProfileWithFallback } from '@/hooks/use-user-profile';
import { useSubscriptionData } from '@/contexts/SubscriptionContext';
import { useUsageRealtime } from '@/hooks/useUsageRealtime';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { CreditPurchaseModal } from '@/components/billing/credit-purchase';
import { BillingModal } from '@/components/billing/billing-modal';
import { isLocalMode } from '@/lib/config';
import { getSubscription, createPortalSession } from '@/lib/api';
import { toast } from 'sonner';
import BoringAvatar from 'boring-avatars';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userProfilesApi, type UserProfile } from '@/lib/api/user-profiles';
import { useQueryClient } from '@tanstack/react-query';
import { useUsageLogs } from '@/hooks/react-query/subscriptions/use-billing';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// Dynamic icon component that changes path based on theme
const DynamicIcon = ({
  lightPath,
  darkPath,
  alt,
  width,
  height,
  className,
}: {
  lightPath: string;
  darkPath: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) => {
  const { theme } = useTheme();
  const iconPath = theme === 'dark' ? darkPath : lightPath;

  return (
    <Image
      src={iconPath}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

// Custom Usage Icon Component (Air Balloon)
const UsageIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-4 w-4"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M10 19m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M12 16c3.314 0 6 -4.686 6 -8a6 6 0 1 0 -12 0c0 3.314 2.686 8 6 8z" />
    <path d="M12 9m-2 0a2 7 0 1 0 4 0a2 7 0 1 0 -4 0" />
  </svg>
);

// Custom Credit Icon Component
const CreditIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-4 w-4"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M15.588 15.537l-3.553 -3.537l-7.742 8.18c-.791 .85 .153 2.18 1.238 1.73l9.616 -4.096a1.398 1.398 0 0 0 .44 -2.277z" />
    <path d="M8.412 8.464l3.553 3.536l7.742 -8.18c.791 -.85 -.153 -2.18 -1.238 -1.73l-9.616 4.098a1.398 1.398 0 0 0 -.44 2.277z" />
  </svg>
);

export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: SettingsSection;
}

type SettingsSection = 'profile' | 'billing';

const workOptions = [
  'Product Management',
  'Engineering',
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Data Science',
  'Design',
  'Legal',
  'Other',
];

export function SettingsModal({ open, onOpenChange, defaultSection = 'profile' }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(defaultSection);
  const [isManaging, setIsManaging] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Reset active section when modal opens with a new defaultSection
  React.useEffect(() => {
    if (open) {
      setActiveSection(defaultSection);
    }
  }, [open, defaultSection]);
  const [editMode, setEditMode] = useState(true);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    preferredName: '',
    workDescription: '',
    personalReferences: '',
    avatar: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showDailyUsage, setShowDailyUsage] = useState(false);
  const [usagePage, setUsagePage] = useState(0);
  const USAGE_ITEMS_PER_PAGE = 10;
  const [hasProfile, setHasProfile] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  const { user: authUser } = useAuth();
  const { profile, preferredName, isLoading: profileLoading } = useUserProfileWithFallback();
  const { data: subscriptionData, refetch: refetchSubscription } = useSubscriptionData();
  const queryClient = useQueryClient();
  
  // Fetch usage logs data
  const { data: usageData, isLoading: usageLoading } = useUsageLogs(usagePage, USAGE_ITEMS_PER_PAGE);

  // Enable real-time updates for usage data
  useUsageRealtime(authUser?.id);

  // Load user profile data
  const loadUserProfile = async () => {
    try {
      const userProfile = await userProfilesApi.getProfile();
      setLocalProfile(userProfile);
      
      // Handle custom role display
      const workDesc = userProfile.work_description;
      
      // Check if the work description is a custom role (not in predefined options)
      if (workDesc && !workOptions.includes(workDesc)) {
        // It's a custom role, show "Other" in dropdown and the custom text in input
        setProfileForm({
          fullName: userProfile.full_name || '',
          preferredName: userProfile.preferred_name || '',
          workDescription: 'Other',
          personalReferences: userProfile.personal_references || '',
          avatar: userProfile.avatar || ''
        });
        setShowCustomRoleInput(true);
        setCustomRole(workDesc);
      } else {
        // It's a predefined role, show it normally
        const normalizedWorkDesc = normalizeWorkDescription(workDesc);
        setProfileForm({
          fullName: userProfile.full_name || '',
          preferredName: userProfile.preferred_name || '',
          workDescription: normalizedWorkDesc,
          personalReferences: userProfile.personal_references || '',
          avatar: userProfile.avatar || ''
        });
        setShowCustomRoleInput(false);
        setCustomRole('');
      }
      
      setHasProfile(true);
    } catch (error) {
      if (error instanceof Error && error.message === 'Profile not found') {
        setHasProfile(false);
        setLocalProfile(null);
      } else {
        console.error('Error loading profile:', error);
      }
    }
  };

  // Initialize profile form when profile data loads
  React.useEffect(() => {
    if (profile && !profileLoading) {
      setLocalProfile(profile);
      
      // Handle custom role display
      const workDesc = profile.work_description;
      
      // Check if the work description is a custom role (not in predefined options)
      if (workDesc && !workOptions.includes(workDesc)) {
        // It's a custom role, show "Other" in dropdown and the custom text in input
        setProfileForm({
          fullName: profile.full_name || '',
          preferredName: profile.preferred_name || '',
          workDescription: 'Other',
          personalReferences: profile.personal_references || '', // Load existing personal references
          avatar: profile.avatar || ''
        });
        setShowCustomRoleInput(true);
        setCustomRole(workDesc);
      } else {
        // It's a predefined role, show it normally
        const normalizedWorkDesc = normalizeWorkDescription(workDesc);
        setProfileForm({
          fullName: profile.full_name || '',
          preferredName: profile.preferred_name || '',
          workDescription: normalizedWorkDesc,
          personalReferences: profile.personal_references || '', // Load existing personal references
          avatar: profile.avatar || ''
        });
        setShowCustomRoleInput(false);
        setCustomRole('');
      }
      
      setHasProfile(true);
    } else if (!profile && !profileLoading) {
      setHasProfile(false);
      setLocalProfile(null);
    }
  }, [profile, profileLoading]);

  // Load profile on mount
  React.useEffect(() => {
    if (authUser?.id) {
      loadUserProfile();
    }
  }, [authUser?.id]);

  // Helper function to normalize work description
  const normalizeWorkDescription = (workDesc: string): string => {
    // If it's already a display name, return as is
    if (workOptions.includes(workDesc)) {
      return workDesc;
    }
    // If it's an ID, convert to display name
    if (roleIdToName[workDesc]) {
      return roleIdToName[workDesc];
    }
    // If it's neither, return as is (fallback)
    return workDesc;
  };

  // Mapping from role IDs to display names for backward compatibility
  const roleIdToName: Record<string, string> = {
    'product-management': 'Product Management',
    'engineering': 'Engineering',
    'hr': 'Human Resources',
    'finance': 'Finance',
    'marketing': 'Marketing',
    'sales': 'Sales',
    'operations': 'Operations',
    'data-science': 'Data Science',
    'design': 'Design',
    'legal': 'Legal',
    'other': 'Other',
  };

  const handleManageSubscription = () => {
    setShowBillingModal(true);
  };

  const handleAddCredits = () => {
    setShowCreditPurchaseModal(true);
  };

  const handleAvatarChange = (avatarValue: string) => {
    setProfileForm(prev => ({ ...prev, avatar: avatarValue }));
    // Update the local profile state immediately for real-time display
    if (localProfile) {
      setLocalProfile({ ...localProfile, avatar: avatarValue });
    }
    // Invalidate the user profile query to update navigation and other components
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    // Force a refetch to ensure immediate update
    queryClient.refetchQueries({ queryKey: ['user-profile'] });
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!profileForm.fullName.trim() || !profileForm.preferredName.trim() || !profileForm.workDescription || !profileForm.avatar) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (profileForm.workDescription === 'Other' && !customRole.trim()) {
      toast.error('Please specify your role');
      return;
    }

    setIsLoading(true);
    
    try {
      const profileData = {
        full_name: profileForm.fullName.trim(),
        preferred_name: profileForm.preferredName.trim(),
        work_description: profileForm.workDescription === 'Other' ? customRole.trim() : normalizeWorkDescription(profileForm.workDescription),
        personal_references: profileForm.personalReferences.trim() || undefined,
        avatar: profileForm.avatar,
      };

      console.log('Submitting profile data:', profileData);
      console.log('Form data state:', profileForm);

      let userProfile: UserProfile;
      if (hasProfile) {
        console.log('Updating existing profile...');
        userProfile = await userProfilesApi.updateProfile(profileData);
      } else {
        console.log('Creating new profile...');
        userProfile = await userProfilesApi.createProfile(profileData);
      }

      // Update local state with the response
      setLocalProfile(userProfile);
      setProfileForm({
        fullName: userProfile.full_name,
        preferredName: userProfile.preferred_name,
        workDescription: userProfile.work_description && !workOptions.includes(userProfile.work_description) ? 'Other' : normalizeWorkDescription(userProfile.work_description),
        personalReferences: userProfile.personal_references || '',
        avatar: userProfile.avatar,
      });
      
      // Handle custom role display
      if (userProfile.work_description && !workOptions.includes(userProfile.work_description)) {
        setShowCustomRoleInput(true);
        setCustomRole(userProfile.work_description);
      } else {
        setShowCustomRoleInput(false);
        setCustomRole('');
      }
      
      setHasProfile(true);
      
      // Invalidate the user profile query to update navigation and other components
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Force a refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ['user-profile'] });
      
      // Clear any cached user data to force fresh data
      localStorage.removeItem('cached_user_name');
      localStorage.removeItem('cached_capitalized_name');
      
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate avatar options with different color combinations
  const generateAvatarOptions = () => {
    const colorPalettes = [
      ['#0a0310', '#80007b', '#455bff', '#ffff45', '#96ff45'],
      ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
      ['#2d3748', '#4a5568', '#718096', '#a0aec0', '#e2e8f0'],
      ['#1a202c', '#2d3748', '#4a5568', '#718096', '#a0aec0'],
      ['#2c1810', '#5d4037', '#8d6e63', '#a1887f', '#d7ccc8'],
      ['#1b5e20', '#2e7d32', '#388e3c', '#4caf50', '#66bb6a'],
      ['#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5'],
      ['#6a1b9a', '#7b1fa2', '#8e24aa', '#9c27b0', '#ab47bc'],
      ['#d84315', '#e64a19', '#f4511e', '#ff5722', '#ff7043'],
      ['#ff6f00', '#ff8f00', '#ffa000', '#ffb300', '#ffc107'],
    ];
    
    return colorPalettes.map((colors, index) => ({
      id: index,
      colors,
      value: JSON.stringify({ colors, variant: 'beam' })
    }));
  };

      const navigationItems = [
        { id: 'profile' as SettingsSection, label: 'Profile', icon: User },
        { id: 'billing' as SettingsSection, label: 'Credits', icon: CreditIcon },
      ];

  const renderProfileContent = () => (
    <div className="space-y-6">
      {/* User Profile Section */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {localProfile?.avatar ? (
            <div className="h-16 w-16 rounded-full overflow-hidden">
              <BoringAvatar
                name={profileForm.fullName || preferredName || authUser?.user_metadata?.full_name || 'User'}
                colors={JSON.parse(localProfile.avatar).colors}
                variant="beam"
                size={64}
              />
            </div>
          ) : (
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-green-500 text-white text-xl font-semibold">
                {getInitials(profileForm.fullName || preferredName || authUser?.user_metadata?.full_name || 'User')}
              </AvatarFallback>
            </Avatar>
          )}
          <button
            type="button"
            onClick={() => setShowAvatarModal(true)}
            className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 mt-2 block"
          >
            Change avatar
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {preferredName || authUser?.user_metadata?.full_name || 'User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {authUser?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form (when in edit mode) */}
      {editMode && (
        <div className="space-y-6 pt-6 border-t">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {/* Preferred Name */}
            <div className="space-y-2">
              <Label htmlFor="preferredName" className="text-sm font-medium">
                What should Helium call you? <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preferredName"
                type="text"
                placeholder="Enter your preferred name or nickname"
                value={profileForm.preferredName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, preferredName: e.target.value }))}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {/* Work Description */}
            <div className="space-y-2">
              <Label htmlFor="workDescription" className="text-sm font-medium">
                What describes your work? <span className="text-red-500">*</span>
              </Label>
              <Select
                value={profileForm.workDescription}
                onValueChange={(value) => {
                  setProfileForm(prev => ({ ...prev, workDescription: value }));
                  if (value === 'Other') {
                    setShowCustomRoleInput(true);
                    setCustomRole('');
                  } else {
                    setShowCustomRoleInput(false);
                    setCustomRole('');
                  }
                }}
                required
              >
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select your work area" />
                </SelectTrigger>
                <SelectContent>
                  {workOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Custom role input when "Other" is selected */}
              {showCustomRoleInput && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="customRole" className="text-sm font-medium">
                    Please specify your role <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customRole"
                    placeholder="Enter your role or job title"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              )}
            </div>

            {/* Personal References */}
            <div className="space-y-2">
              <Label htmlFor="personalReferences" className="text-sm font-medium">
                Description (e.g., about company, your role)
                <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
              </Label>
              <Textarea
                id="personalReferences"
                placeholder="Tell us about your company, role, or any context that would help Helium provide more personalized responses..."
                value={profileForm.personalReferences}
                onChange={(e) => setProfileForm(prev => ({ ...prev, personalReferences: e.target.value }))}
                rows={4}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-center">
                <Button
                onClick={handleSaveProfile}
                disabled={isLoading || !profileForm.fullName.trim() || !profileForm.preferredName.trim() || !profileForm.workDescription || (profileForm.workDescription === 'Other' && !customRole.trim())}
                className="px-8 h-10 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Profile...</span>
                  </div>
                ) : (
                  <span>Update Profile</span>
                )}
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBillingContent = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Billing & Subscription</h3>
        
        {isLocalMode() ? (
          <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Running in local development mode - billing features are disabled
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              All premium features are available in this environment
            </p>
          </div>
        ) : (
          <>
            {/* Plan Card - Single Card Design */}
            <div className="p-4 border border-border rounded-lg bg-background">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground" style={{ fontSize: '16px' }}>
                  {subscriptionData?.plan_name || 'Free'}
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleManageSubscription}
                    className="text-xs rounded-full h-8 px-3 bg-foreground text-background hover:bg-foreground/90"
                    style={{ fontSize: '13px' }}
                  >
                    Manage
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddCredits}
                    className="text-xs rounded-full h-8 px-3 bg-foreground text-background hover:bg-foreground/90"
                    style={{ fontSize: '13px' }}
                  >
                    Add Credits
                  </Button>
                </div>
              </div>
              
              <Separator className="mb-4" />
              
              {/* Credits Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ fontSize: '14px' }}>Total credits left</span>
                  <span className="text-sm font-medium" style={{ fontSize: '14px' }}>
                    {subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100)}
                  </span>
                </div>
                
                {subscriptionData?.plan_name === 'free' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>Free credits left</span>
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>
                        {Math.max(0, Math.round((subscriptionData?.cost_limit || 0) * 100) - Math.round((subscriptionData?.current_usage || 0) * 100))} / {Math.round((subscriptionData?.cost_limit || 0) * 100)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>Monthly credits left</span>
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>0</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>Add on credits left</span>
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>
                        {subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>Monthly credits left</span>
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>
                        {Math.max(0, Math.round((subscriptionData?.cost_limit || 0) * 100) - Math.round((subscriptionData?.current_usage || 0) * 100))}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>Add on credits left</span>
                      <span className="text-sm font-medium" style={{ fontSize: '14px' }}>
                        {subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Usage Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground" style={{ fontSize: '18px' }}>Usage</h4>
              
              {/* Usage Log Table */}
              <div className="border border-border rounded-lg bg-background overflow-hidden">
                <div className="max-h-70 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/99 sticky top-0">
                      <tr>
                        <th className="text-left p-4 font-medium text-foreground text-xs">Details</th>
                        <th className="text-center p-4 font-medium text-foreground text-xs">Date</th>
                        <th className="text-right p-4 font-medium text-foreground text-xs">Credits change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usageLoading ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">
                            Loading usage data...
                          </td>
                        </tr>
                      ) : usageData?.logs && usageData.logs.length > 0 ? (
                        usageData.logs.slice(0, USAGE_ITEMS_PER_PAGE).map((log, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="p-4 text-xs text-foreground">
                              {log.project_name || 'Unknown Thread'}
                            </td>
                            <td className="p-4 text-xs text-muted-foreground text-center">
                              {new Date(log.created_at).toLocaleDateString('en-CA')} {new Date(log.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </td>
                            <td className="p-4 text-xs text-foreground text-right font-medium">
                              -{Math.round(log.total_credits || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">
                            No usage data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {(usageData && usageData.has_more) || usagePage > 0 ? (
                  <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={usagePage === 0}
                      onClick={() => setUsagePage(prev => Math.max(0, prev - 1))}
                      className="text-muted-foreground"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(4, Math.ceil((usageData?.logs?.length || 0) / USAGE_ITEMS_PER_PAGE) + 1) }, (_, i) => (
                        <Button
                          key={i}
                          variant={usagePage === i ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setUsagePage(i)}
                          className={`text-xs px-2 py-1 h-6 ${
                            usagePage === i 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!usageData?.has_more}
                      onClick={() => setUsagePage(prev => prev + 1)}
                      className="text-foreground"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileContent();
      case 'billing':
        return renderBillingContent();
      default:
        return renderProfileContent();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[700px] w-[80vw] max-h-[85vh] overflow-hidden p-0 border-0">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-full relative max-h-screen overflow-y-auto md:overflow-y-scroll">
          {/* Mobile Header - Only visible on mobile */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 bg-background border-b border-border p-4 flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <DialogClose className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>

          {/* Left Navigation Sidebar - Desktop */}
          <div className="hidden md:block w-64 border-r border-border bg-sidebar dark:bg-grey p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <DynamicIcon
                lightPath="/logo-light.svg"
                darkPath="/logo-dark.svg"
                alt="Helium"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="font-semibold text-foreground">Helium</span>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Overlay Sidebar */}
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="md:hidden fixed inset-0 bg-black/20 z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              
              {/* Sidebar */}
              <div className={`md:hidden fixed left-0 top-0 bottom-0 w-64 max-[480px]:w-48 bg-sidebar dark:bg-sidebar border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}>
                <div className="p-4 space-y-4 h-full">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <DynamicIcon
                        lightPath="/logo-light.svg"
                        darkPath="/logo-dark.svg"
                        alt="Helium"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                      <span className="font-semibold text-foreground">Helium</span>
                    </div>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                  
                    </button>
                  </div>

                  {/* Navigation Items */}
                  <nav className="space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </>
          )}
          
          {/* Right Content Area */}
          <div className="flex-1 p-6 overflow-y-auto h-full md:pt-6 pt-20">
            <div className="max-w-2xl h-full">
            {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Avatar Selection Modal */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Select Your Avatar</DialogTitle>
          
          <div className="space-y-4">
            {/* Avatar Grid */}
            <div className="grid grid-cols-8 gap-3 p-4 bg-muted/30 rounded-lg">
              {generateAvatarOptions().map((avatarOption, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    handleAvatarChange(avatarOption.value);
                    setShowAvatarModal(false);
                  }}
                  className={`
                    relative p-2 rounded-full transition-all duration-200
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50
                    ${profileForm.avatar === avatarOption.value 
                      ? 'ring-2 ring-primary shadow-lg scale-110 bg-primary/10' 
                      : 'hover:shadow-md hover:bg-muted/50'
                    }
                  `}
                >
                  <BoringAvatar
                    name={profileForm.fullName || 'User'}
                    colors={avatarOption.colors}
                    variant="beam"
                    size={48}
                  />
                  {profileForm.avatar === avatarOption.value && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Current Selection Info */}
            {profileForm.avatar && (
              <div className="flex items-center justify-center space-x-3 p-3 bg-primary/5 rounded-lg">
                <span className="text-sm font-medium">Current selection:</span>
                <BoringAvatar
                  name={profileForm.fullName || 'User'}
                  colors={JSON.parse(profileForm.avatar).colors}
                  variant="beam"
                  size={32}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAvatarModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowAvatarModal(false)}
              disabled={!profileForm.avatar}
            >
              Confirm Selection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        open={showCreditPurchaseModal}
        onOpenChange={setShowCreditPurchaseModal}
        currentBalance={subscriptionData?.credit_balance_credits || 0}
        canPurchase={true}
        onPurchaseComplete={() => {
          refetchSubscription();
          setShowCreditPurchaseModal(false);
        }}
      />
      
      {/* Billing Modal */}
      <BillingModal 
        open={showBillingModal} 
        onOpenChange={setShowBillingModal}
        returnUrl={typeof window !== 'undefined' ? window.location.href : '/'}
      />
    </Dialog>
  );
}
