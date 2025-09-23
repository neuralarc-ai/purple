'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi, ThreadTokenUsage } from '@/lib/api-enhanced';

export function useThreadTokenUsage(threadId: string, agentStatus?: 'idle' | 'running' | 'connecting' | 'paused' | 'error') {
  const staleTime = agentStatus === 'running' ? 10 * 1000 : 30 * 1000;
  const refetchInterval = agentStatus === 'running' ? 15 * 1000 : 60 * 1000;

  return useQuery({
    queryKey: ['thread-token-usage', threadId],
    queryFn: async (): Promise<ThreadTokenUsage | null> => {
      if (!threadId) return null;
      
      try {
        // Use the working usage logs method directly
        const allLogs = await billingApi.getUsageLogs(0, 1000);
        
        if (!allLogs?.logs) return null;
        
        // Filter logs for this specific thread
        const threadLogs = allLogs.logs.filter(log => log.thread_id === threadId);
        
        if (threadLogs.length === 0) return null;
        
        // Calculate totals
        const totalCompletionTokens = threadLogs.reduce((sum, log) => 
          sum + log.total_completion_tokens, 0
        );
        
        const totalPromptTokens = threadLogs.reduce((sum, log) => 
          sum + log.total_prompt_tokens, 0
        );
        
        const totalTokens = threadLogs.reduce((sum, log) => 
          sum + log.total_tokens, 0
        );
        
        const totalCost = threadLogs.reduce((sum, log) => 
          sum + (log.total_credits / 100), 0 // Convert credits back to dollars
        );
        
        const models = [...new Set(threadLogs.map(log => log.primary_model))];
        
        const result = {
          total_completion_tokens: totalCompletionTokens,
          total_prompt_tokens: totalPromptTokens,
          total_tokens: totalTokens,
          estimated_cost: totalCost, // Assuming estimated_cost is now total_cost
          request_count: threadLogs.length,
          models,
        };
        
        return result;
        
      } catch (error) {
        console.error(`[useThreadTokenUsage] Error fetching thread token usage for ${threadId}:`, error);
        return null;
      }
    },
    enabled: !!threadId,
    staleTime,
    gcTime: 2 * 60 * 1000, // 2 minutes cache time
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount for fresh data
    refetchInterval,
    refetchIntervalInBackground: false, // Only refetch when tab is active
  });
}
