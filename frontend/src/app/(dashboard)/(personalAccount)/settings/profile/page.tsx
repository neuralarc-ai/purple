'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Save, CheckCircle, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { userProfilesApi, type UserProfile } from '@/lib/api/user-profiles';
import Avatar from 'boring-avatars';
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';

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

interface ProfileFormData {
  fullName: string;
  preferredName: string;
  workDescription: string;
  personalReferences: string;
  avatar: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    preferredName: '',
    workDescription: '',
    personalReferences: '',
    avatar: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Add state for custom role input
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [customRole, setCustomRole] = useState('');

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load existing profile data on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Set default avatar if none is selected and profile loading is complete
  useEffect(() => {
    if (!formData.avatar && !isLoading && !hasProfile) {
      const defaultAvatar = generateAvatarOptions()[0];
      setFormData(prev => ({ ...prev, avatar: defaultAvatar.value }));
    }
  }, [formData.avatar, isLoading, hasProfile]);

  const loadUserProfile = async () => {
    try {
      const userProfile = await userProfilesApi.getProfile();
      setProfile(userProfile);
      
      // Handle custom role display
      const workDesc = userProfile.work_description;
      
      // Check if the work description is a custom role (not in predefined options)
      if (workDesc && !workOptions.includes(workDesc)) {
        // It's a custom role, show "Other" in dropdown and the custom text in input
        setFormData({
          fullName: userProfile.full_name,
          preferredName: userProfile.preferred_name,
          workDescription: 'Other',
          personalReferences: '', // Don't load any existing personal references
          avatar: userProfile.avatar,
        });
        setShowCustomRoleInput(true);
        setCustomRole(workDesc);
      } else {
        // It's a predefined role, show it normally
        const normalizedWorkDesc = normalizeWorkDescription(workDesc);
        setFormData({
          fullName: userProfile.full_name,
          preferredName: userProfile.preferred_name,
          workDescription: normalizedWorkDesc,
          personalReferences: '', // Don't load any existing personal references
          avatar: userProfile.avatar,
        });
        setShowCustomRoleInput(false);
        setCustomRole('');
      }
      
      setHasProfile(true);
    } catch (error) {
      if (error instanceof Error && error.message === 'Profile not found') {
        setHasProfile(false);
        setProfile(null);
      } else {
        console.error('Error loading profile:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName.trim() || !formData.preferredName.trim() || !formData.workDescription || !formData.avatar) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const profileData = {
        full_name: formData.fullName.trim(),
        preferred_name: formData.preferredName.trim(),
        work_description: formData.workDescription === 'Other' ? customRole.trim() : normalizeWorkDescription(formData.workDescription),
        personal_references: formData.personalReferences.trim() || undefined,
        avatar: formData.avatar,
      };

      console.log('Submitting profile data:', profileData);
      console.log('Form data state:', formData);

      let userProfile: UserProfile;
      if (hasProfile) {
        console.log('Updating existing profile...');
        userProfile = await userProfilesApi.updateProfile(profileData);
      } else {
        console.log('Creating new profile...');
        userProfile = await userProfilesApi.createProfile(profileData);
      }

      setProfile(userProfile);
      setFormData({
        fullName: userProfile.full_name,
        preferredName: userProfile.preferred_name,
        workDescription: userProfile.work_description && !workOptions.includes(userProfile.work_description) ? 'Other' : normalizeWorkDescription(userProfile.work_description),
        personalReferences: '', // Keep personal references empty
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
      setIsSubmitted(true);
      toast.success('Profile updated successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.fullName.trim() && formData.preferredName.trim() && formData.workDescription && formData.avatar && (formData.workDescription !== 'Other' || customRole.trim());

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4 md:pt-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Tell us about yourself to personalize your Helium experience
          </p>
        </div>
        
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Loading profile...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 md:pt-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Tell us about yourself to personalize your Helium experience
        </p>
      </div>

      <Card className="max-w-2xl">
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Display */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="group cursor-pointer transition-transform hover:scale-105"
                >
                  {profile?.avatar ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <Avatar
                        name={formData.fullName || 'User'}
                        colors={JSON.parse(profile.avatar).colors}
                        variant="beam"
                        size={80}
                      />
                    </div>
                  ) : (
                    <UIAvatar className="w-20 h-20 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarFallback className="text-2xl font-semibold">
                        {getInitials(formData.fullName || user?.user_metadata?.name || 'User')}
                      </AvatarFallback>
                    </UIAvatar>
                  )}
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.avatar ? 'Custom avatar selected' : 'Click to select an avatar'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 mt-1"
                >
                  Change avatar
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
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
                value={formData.preferredName}
                onChange={(e) => handleInputChange('preferredName', e.target.value)}
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
                value={formData.workDescription}
                onValueChange={(value) => {
                  handleInputChange('workDescription', value);
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
                value={formData.personalReferences}
                onChange={(e) => handleInputChange('personalReferences', e.target.value)}
                rows={4}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`
                  w-full h-12 text-base font-medium
                  transition-all duration-300 ease-out
                  transform hover:scale-[1.02] active:scale-[0.98]
                  shadow-lg hover:shadow-xl
                  bg-gradient-to-r from-primary to-primary/90
                  hover:from-primary/90 hover:to-primary
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:transform-none disabled:shadow-lg
                  group
                `}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Profile...</span>
                  </div>
                ) : isSubmitted ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Profile Updated!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span>{hasProfile ? 'Update Profile' : 'Create Profile'}</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Avatar Selection Modal */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Avatar</DialogTitle>
            <DialogDescription>
              Choose from our collection of unique avatars. Click on any avatar to select it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Avatar Grid */}
            <div className="grid grid-cols-8 gap-3 p-4 bg-muted/30 rounded-lg">
              {generateAvatarOptions().map((avatarOption, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    handleInputChange('avatar', avatarOption.value);
                    // Update the profile state immediately for real-time display
                    if (profile) {
                      setProfile({ ...profile, avatar: avatarOption.value });
                    }
                    // Also update form data to ensure immediate display
                    setFormData(prev => ({ ...prev, avatar: avatarOption.value }));
                    setShowAvatarModal(false);
                  }}
                  className={`
                    relative p-2 rounded-full transition-all duration-200
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50
                    ${formData.avatar === avatarOption.value 
                      ? 'ring-2 ring-primary shadow-lg scale-110 bg-primary/10' 
                      : 'hover:shadow-md hover:bg-muted/50'
                    }
                  `}
                >
                  <Avatar
                    name={formData.fullName || 'User'}
                    colors={avatarOption.colors}
                    variant="beam"
                    size={48}
                  />
                  {formData.avatar === avatarOption.value && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Current Selection Info */}
            {formData.avatar && (
              <div className="flex items-center justify-center space-x-3 p-3 bg-primary/5 rounded-lg">
                <span className="text-sm font-medium">Current selection:</span>
                <Avatar
                  name={formData.fullName || 'User'}
                  colors={JSON.parse(formData.avatar).colors}
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
              disabled={!formData.avatar}
            >
              Confirm Selection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}