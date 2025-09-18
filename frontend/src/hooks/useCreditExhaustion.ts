'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { BillingError } from '@/lib/api';
import { UnifiedMessage } from '@/components/thread/types';

interface CreditExhaustionState {
  isExhausted: boolean;
  message: string;
  showBanner: boolean;
}

interface UseCreditExhaustionOptions {
  onAddCreditExhaustionMessage?: (message: UnifiedMessage) => void;
  messages?: UnifiedMessage[]; // Add messages to check for existing credit exhaustion
  subscriptionData?: any; // Add subscription data to check credit balance
}

export function useCreditExhaustion(options?: UseCreditExhaustionOptions) {
  const [state, setState] = useState<CreditExhaustionState>({
    isExhausted: false,
    message: '',
    showBanner: false,
  });

  // Check for existing credit exhaustion messages in the thread (optimized with useMemo)
  const hasCreditExhaustionMessage = useMemo(() => {
    return options?.messages?.some(msg => msg.type === 'credit_exhaustion') || false;
  }, [options?.messages]);

  // Update state when credit exhaustion message is detected
  useEffect(() => {
    if (hasCreditExhaustionMessage && !state.isExhausted) {
      setState({
        isExhausted: true,
        message: 'Your credits have been used up. Please upgrade your plan for more credits.',
        showBanner: true,
      });
    }
  }, [hasCreditExhaustionMessage, state.isExhausted]);

  // Check if credits are sufficient to hide the banner or if we need to show it
  useEffect(() => {
    if (options?.subscriptionData) {
      const subscriptionData = options.subscriptionData;
      
      // Calculate total available credits
      const subscriptionLimit = subscriptionData?.cost_limit ? Math.round((subscriptionData.cost_limit) * 100) : 0;
      const currentUsage = subscriptionData?.current_usage ? Math.round((subscriptionData.current_usage) * 100) : 0;
      const addOnCredits = subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100);
      
      // Free credits (if any) - for free tier users
      const freeCreditsLeft = subscriptionData?.plan_name === 'free' ? Math.max(0, subscriptionLimit - currentUsage) : 0;
      
      // Monthly credits (subscription-based)
      const monthlyCreditsLeft = subscriptionData?.plan_name !== 'free' ? Math.max(0, subscriptionLimit - currentUsage) : 0;
      
      // Total credits available
      const totalCreditsLeft = freeCreditsLeft + monthlyCreditsLeft + addOnCredits;
      
      // Minimum threshold is 20 credits ($0.20)
      const MINIMUM_CREDITS_THRESHOLD = 20;
      
      // Show banner if credits are below threshold (even without explicit exhaustion message)
      if (totalCreditsLeft < MINIMUM_CREDITS_THRESHOLD) {
        setState(prev => ({
          isExhausted: true,
          message: 'Your credits have been used up. Please upgrade your plan for more credits.',
          showBanner: true,
        }));
      } else if (state.isExhausted) {
        // If user has sufficient credits, hide the banner
        setState(prev => ({
          ...prev,
          showBanner: false,
        }));
      }
    }
  }, [options?.subscriptionData, state.isExhausted]);

  const createCreditExhaustionMessage = useCallback((threadId: string, message: string): UnifiedMessage => {
    return {
      message_id: `credit-exhaustion-${Date.now()}`,
      thread_id: threadId,
      type: 'credit_exhaustion',
      is_llm_message: false,
      content: JSON.stringify({
        role: 'system',
        content: message,
      }),
      metadata: JSON.stringify({
        credit_exhaustion: true,
        timestamp: new Date().toISOString(),
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, []);

  const handleCreditError = useCallback((error: any, threadId?: string) => {
    // Check if it's a billing/credit related error
    if (error instanceof BillingError) {
      const message = error.detail?.message || 'Your credits have been used up. Please upgrade your plan for more credits.';
      
      setState({
        isExhausted: true,
        message,
        showBanner: true,
      });

      // Add persistent message to thread if threadId is provided
      if (threadId && options?.onAddCreditExhaustionMessage) {
        const creditMessage = createCreditExhaustionMessage(threadId, message);
        options.onAddCreditExhaustionMessage(creditMessage);
      }
      
      return true;
    }

    // Check for 402 Payment Required errors
    if (error?.status === 402 || error?.response?.status === 402) {
      const message = error?.detail?.message || 
                     error?.data?.detail?.message || 
                     'Your credits have been used up. Please upgrade your plan for more credits.';
      
      setState({
        isExhausted: true,
        message,
        showBanner: true,
      });

      // Add persistent message to thread if threadId is provided
      if (threadId && options?.onAddCreditExhaustionMessage) {
        const creditMessage = createCreditExhaustionMessage(threadId, message);
        options.onAddCreditExhaustionMessage(creditMessage);
      }
      
      return true;
    }

    // Check for credit-related error messages
    if (error?.message || error?.error?.message) {
      const errorMessage = error?.message || error?.error?.message;
      const lowerMessage = errorMessage.toLowerCase();
      
      if (lowerMessage.includes('credit') && 
          (lowerMessage.includes('insufficient') || 
           lowerMessage.includes('exhausted') || 
           lowerMessage.includes('used up') ||
           lowerMessage.includes('limit reached') ||
           lowerMessage.includes('not enough') ||
           lowerMessage.includes('balance') ||
           lowerMessage.includes('required') ||
           lowerMessage.includes('need'))) {
        
        const message = 'Your credits have been used up. Please upgrade your plan for more credits.';
        
        setState({
          isExhausted: true,
          message,
          showBanner: true,
        });

        // Add persistent message to thread if threadId is provided
        if (threadId && options?.onAddCreditExhaustionMessage) {
          const creditMessage = createCreditExhaustionMessage(threadId, message);
          options.onAddCreditExhaustionMessage(creditMessage);
        }
        
        return true;
      }
    }

    return false;
  }, [options, createCreditExhaustionMessage]);

  const clearCreditExhaustion = useCallback(() => {
    // Don't immediately clear the banner - let the credit balance check handle it
    // This allows the banner to persist until credits are actually sufficient
    setState(prev => ({
      ...prev,
      // Keep the exhausted state but let the useEffect handle banner visibility
    }));
  }, []);

  const hideBanner = useCallback(() => {
    setState(prev => ({
      ...prev,
      showBanner: false,
    }));
  }, []);

  return {
    ...state,
    handleCreditError,
    clearCreditExhaustion,
    hideBanner,
  };
}
