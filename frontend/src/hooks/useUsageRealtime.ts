'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to subscribe to real-time usage updates and invalidate React Query cache
 * This ensures the frontend immediately knows when usage data is updated
 */
export function useUsageRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) {
      console.log('[useUsageRealtime] No user ID provided, skipping subscription');
      return;
    }

    console.log(`[useUsageRealtime] Setting up real-time subscriptions for user: ${userId}`);
    const supabase = createClient();

    // Subscribe to usage_logs changes
    const usageChannel = supabase
      .channel(`usage-logs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'usage_logs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useUsageRealtime] Usage logs real-time update:', payload);
          
          // Invalidate all usage-related queries
          queryClient.invalidateQueries({
            queryKey: ['usage-logs']
          });
          
          // Invalidate thread token usage queries
          queryClient.invalidateQueries({
            queryKey: ['thread-token-usage']
          });
          
          // Invalidate subscription queries
          queryClient.invalidateQueries({
            queryKey: ['subscription', 'details']
          });
        }
      )
      .subscribe((status) => {
        console.log(`[useUsageRealtime] Usage logs subscription status: ${status}`);
      });

    // Subscribe to credit_usage changes
    const creditChannel = supabase
      .channel(`credit-usage-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'credit_usage',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useUsageRealtime] Credit usage real-time update:', payload);
          
          // Invalidate all usage-related queries
          queryClient.invalidateQueries({
            queryKey: ['usage-logs']
          });
          
          // Invalidate thread token usage queries
          queryClient.invalidateQueries({
            queryKey: ['thread-token-usage']
          });
          
          // Invalidate subscription queries
          queryClient.invalidateQueries({
            queryKey: ['subscription', 'details']
          });
        }
      )
      .subscribe((status) => {
        console.log(`[useUsageRealtime] Credit usage subscription status: ${status}`);
      });

    // Store references for cleanup
    subscriptionRef.current = { usageChannel, creditChannel };

    // Cleanup subscriptions
    return () => {
      console.log('[useUsageRealtime] Cleaning up real-time subscriptions');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current.usageChannel);
        supabase.removeChannel(subscriptionRef.current.creditChannel);
        subscriptionRef.current = null;
      }
    };
  }, [userId, queryClient]);
}
