import { useQuery } from '@tanstack/react-query';

interface InviteCodeUsage {
  has_used_invite_code: boolean;
  invite_code?: string;
  used_at?: string;
}

export function useInviteCodeUsage() {
  return useQuery<InviteCodeUsage>({
    queryKey: ['invite-code-usage'],
    queryFn: async () => {
      const response = await fetch('/api/invite-codes/user-usage');
      if (!response.ok) {
        throw new Error('Failed to fetch invite code usage');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
