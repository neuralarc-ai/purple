import { useQuery } from '@tanstack/react-query';
import { userProfilesApi, UserProfile } from '@/lib/api/user-profiles';

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: userProfilesApi.getProfile,
    retry: false, // Don't retry on 404 (profile doesn't exist) or 401 (auth failed)
    staleTime: 0, // Always refetch when invalidated
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: false, // Disable automatic fetching - we'll handle this manually
  });
}

export function useUserProfileWithFallback() {
  const { data: profile, isLoading, error } = useUserProfile();
  
  // If there's an authentication error, don't show it as an error
  const isAuthError = error instanceof Error && (
    error.message.includes('Authentication failed') ||
    error.message.includes('No authentication token') ||
    error.message.includes('HTTP 401')
  );
  
  // If profile exists, return the preferred name, otherwise return null
  const preferredName = profile?.preferred_name || null;
  
  return {
    profile,
    preferredName,
    isLoading,
    error: isAuthError ? null : error, // Don't show auth errors
    hasProfile: !!profile,
    isAuthError,
  };
}
