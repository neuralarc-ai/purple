import { useQuery } from '@tanstack/react-query';
import { userProfilesApi, UserProfile } from '@/lib/api/user-profiles';

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: userProfilesApi.getProfile,
    retry: false, // Don't retry on 404 (profile doesn't exist)
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUserProfileWithFallback() {
  const { data: profile, isLoading, error } = useUserProfile();
  
  // If profile exists, return the preferred name, otherwise return null
  const preferredName = profile?.preferred_name || null;
  
  return {
    profile,
    preferredName,
    isLoading,
    error,
    hasProfile: !!profile,
  };
}
