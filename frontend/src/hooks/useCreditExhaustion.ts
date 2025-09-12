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
  }, [options?.onAddCreditExhaustionMessage, createCreditExhaustionMessage]);

  const clearCreditExhaustion = useCallback(() => {
    setState({
      isExhausted: false,
      message: '',
      showBanner: false,
    });
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
