'use client';

import React, { useState, Suspense, useEffect, useRef, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChatInput,
  ChatInputHandles,
} from '@/components/thread/chat-input/chat-input';
import {
  BillingError,
  AgentRunLimitError,
} from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBillingError } from '@/hooks/useBillingError';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { useAccounts } from '@/hooks/use-accounts';
import { useUserProfileWithFallback } from '@/hooks/use-user-profile';
import { config, isLocalMode, isStagingMode } from '@/lib/config';
import { useInitiateAgentWithInvalidation } from '@/hooks/react-query/dashboard/use-initiate-agent';

import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { BillingModal } from '@/components/billing/billing-modal';
import { useAgentSelection } from '@/lib/stores/agent-selection-store';
import { useThreadQuery } from '@/hooks/react-query/threads/use-threads';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';

import { AgentRunLimitDialog } from '@/components/thread/agent-run-limit-dialog';
import { useFeatureFlag } from '@/lib/feature-flags';
import { CustomAgentsSection } from './custom-agents-section';
import { toast } from 'sonner';
import { ReleaseBadge } from '../auth/release-badge';

import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { TokenUsage } from './token-usage';
import { PromotionalBanner } from './promotional-banner';
import { useInviteCodeUsage } from '@/hooks/use-invite-code-usage';
import { SettingsModal } from '@/components/settings/settings-modal';
import { CreditExhaustionBanner } from '@/components/billing/credit-exhaustion-banner';
import { useCreditExhaustion } from '@/hooks/useCreditExhaustion';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';

const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

export function DashboardContent() {
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false); // Local loading state for immediate feedback
  const [autoSubmit, setAutoSubmit] = useState(false);
  const chatInputRef = useRef<ChatInputHandles>(null);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: accounts } = useAccounts();
  const { preferredName, isLoading: profileLoading } = useUserProfileWithFallback();
  const personalAccount = accounts?.find((account) => account.personal_account);
  const { 
    selectedAgentId, 
    setSelectedAgent, 
    initializeFromAgents,
    getCurrentAgent
  } = useAgentSelection();
  const [initiatedThreadId, setInitiatedThreadId] = useState<string | null>(null);
  const { billingError, handleBillingError, clearBillingError } = useBillingError();
  const { data: subscriptionData } = useSharedSubscription();
  const {
    isExhausted,
    showBanner,
    handleCreditError,
    clearCreditExhaustion,
    hideBanner,
  } = useCreditExhaustion({ subscriptionData });
  const [showAgentLimitDialog, setShowAgentLimitDialog] = useState(false);
  const [agentLimitData, setAgentLimitData] = useState<{
    runningCount: number;
    runningThreadIds: string[];
  } | null>(null);
  const initiateAgentMutation = useInitiateAgentWithInvalidation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPromotionalMessage, setShowPromotionalMessage] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Check if user used an invite code with caching
  const { data: inviteCodeUsage, isLoading: inviteCodeLoading } = useInviteCodeUsage();
  
  // Cache invite code usage result
  const cachedInviteCodeUsage = useMemo(() => {
    if (!inviteCodeLoading && inviteCodeUsage) {
      // Cache the result in sessionStorage for faster retrieval
      sessionStorage.setItem('invite_code_usage', JSON.stringify(inviteCodeUsage));
      return inviteCodeUsage;
    }
    
    // Check sessionStorage for cached result
    const cached = sessionStorage.getItem('invite_code_usage');
    if (cached) {
      return JSON.parse(cached);
    }
    
    return inviteCodeUsage;
  }, [inviteCodeUsage, inviteCodeLoading]);

  // Handle Azure OAuth success
  useEffect(() => {
    const azureSuccess = searchParams?.get('azure_success');
    const email = searchParams?.get('email');

    if (azureSuccess === 'true' && email) {
      console.log('🔄 Handling Azure OAuth success for:', email);
      
      // Show success message
      toast.success(`Welcome! Azure OAuth completed for ${email}`);
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('azure_success');
      newUrl.searchParams.delete('email');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Handle prompt from URL
  useEffect(() => {
    const promptParam = searchParams?.get('prompt');
    if (promptParam) {
      // Decode but don't set the input value
      const decodedPrompt = decodeURIComponent(promptParam);
      // Just focus the input without setting the value
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [searchParams]);
  
  const welcomeMessage = useMemo(() => {
    // Check if we have a cached welcome message
    const cachedMessage = localStorage.getItem('cached_welcome_message');
    if (cachedMessage) {
      return cachedMessage;
    }
    
    // Use the specific message and cache it
    const message = "Hello, {name}\nLet's rise above the noise";
    localStorage.setItem('cached_welcome_message', message);
    return message;
  }, []); // Empty dependency array - uses cached message

  // List of alternative messages - moved outside component for constant caching
  const alternativeMessages = useMemo(() => [
    // Removed alternative messages as requested
  ], []);

  // Function to get a random message from the list
  const getRandomMessage = useCallback(() => {
    // Return empty string since we don't want alternative messages
    return '';
  }, []);

  // Function to get time-based greeting
  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'GoodEvening';
    } else {
      return 'Good Evening'; // Night time (21-5)
    }
  }, []);

  const [currentWelcomeMessage, setCurrentWelcomeMessage] = useState('');
  const [isNameLoaded, setIsNameLoaded] = useState(false);

  // Get user's preferred name or fallback to account name with better caching
  const cachedUserName = useMemo(() => {
    // Early return if we already have the preferred name
    if (preferredName && !profileLoading) {
      setIsNameLoaded(true);
      // Cache the preferred name immediately
      localStorage.setItem('cached_user_name', preferredName);
      const capitalizedName = preferredName.charAt(0).toUpperCase() + preferredName.slice(1).toLowerCase();
      localStorage.setItem('cached_capitalized_name', capitalizedName);
      return capitalizedName;
    }
    
    // Show cached name immediately if available
    const cachedName = localStorage.getItem('cached_user_name');
    if (cachedName) {
      const capitalizedName = localStorage.getItem('cached_capitalized_name') || 'there';
      setIsNameLoaded(true);
      return capitalizedName;
    }
    
    // Process and cache new name when available
    if (!profileLoading && personalAccount?.name) {
      const firstName = personalAccount.name.split(' ')[0];
      const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      
      // Cache both original and capitalized names
      localStorage.setItem('cached_user_name', personalAccount.name);
      localStorage.setItem('cached_capitalized_name', capitalizedFirstName);
      setIsNameLoaded(true);
      return capitalizedFirstName;
    }
    
    // Return default while loading
    return 'there';
  }, [preferredName, profileLoading, personalAccount?.name]);

  // Set welcome message with cached user's name - only when dependencies change
  useEffect(() => {
    // Replace {name} placeholder with cached capitalized name
    const personalizedMessage = welcomeMessage.replace('{name}', cachedUserName);
    setCurrentWelcomeMessage(personalizedMessage);
  }, [welcomeMessage, cachedUserName]);

  // Feature flag for custom agents section
  const { enabled: customAgentsEnabled } = useFeatureFlag('custom_agents');

  // Fetch agents to get the selected agent's name with caching
  const { data: agentsResponse, isLoading: agentsLoading } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });

  // Cache agents data
  const cachedAgents = useMemo(() => {
    if (!agentsLoading && agentsResponse) {
      // Cache the result in sessionStorage for faster retrieval
      sessionStorage.setItem('dashboard_agents', JSON.stringify(agentsResponse));
      return agentsResponse;
    }
    
    // Check sessionStorage for cached result
    const cached = sessionStorage.getItem('dashboard_agents');
    if (cached) {
      return JSON.parse(cached);
    }
    
    return agentsResponse;
  }, [agentsResponse, agentsLoading]);

  const agents = useMemo(() => cachedAgents?.agents || [], [cachedAgents?.agents]);
  const selectedAgent = selectedAgentId
    ? agents.find(agent => agent.agent_id === selectedAgentId)
    : null;
      const displayName = selectedAgent?.name || 'Helium';
  const agentAvatar = undefined;
  const isHeliumAgent = selectedAgent?.metadata?.is_helium_default || false;

  const threadQuery = useThreadQuery(initiatedThreadId || '');

  useEffect(() => {    
    
    if (agents.length > 0) {
      // console.log('📞 Calling initializeFromAgents');
      initializeFromAgents(agents, undefined, setSelectedAgent);
    }
  }, [agents, initializeFromAgents, setSelectedAgent]);

  useEffect(() => {
    const agentIdFromUrl = searchParams.get('agent_id');
    if (agentIdFromUrl && agentIdFromUrl !== selectedAgentId) {
      setSelectedAgent(agentIdFromUrl);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('agent_id');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [searchParams, selectedAgentId, router, setSelectedAgent]);

  useEffect(() => {
    if (threadQuery.data && initiatedThreadId) {
      const thread = threadQuery.data;
      if (thread.project_id) {
        router.push(`/projects/${thread.project_id}/thread/${initiatedThreadId}`);
      } else {
        router.push(`/agents/${initiatedThreadId}`);
      }
      setInitiatedThreadId(null);
    }
  }, [threadQuery.data, initiatedThreadId, router]);

  const handleSubmit = async (
    message: string,
    options?: {
      model_name?: string;
      enable_thinking?: boolean;
      reasoning_effort?: string;
      stream?: boolean;
      enable_context_manager?: boolean;
    },
  ) => {
    if (
      (!message.trim() && !chatInputRef.current?.getPendingFiles().length) ||
      isSubmitting
    )
      return;

    // Set local loading state immediately for instant feedback
    setLocalLoading(true);
    
    // Set loading state immediately
    setIsSubmitting(true);

    try {
      // Process files asynchronously to avoid blocking
      const files = chatInputRef.current?.getPendingFiles() || [];
      localStorage.removeItem(PENDING_PROMPT_KEY);

      // Create FormData asynchronously
      const formData = new FormData();
      formData.append('prompt', message);

      // Add selected agent if one is chosen
      if (selectedAgentId) {
        formData.append('agent_id', selectedAgentId);
      }

      // Process files asynchronously
      files.forEach((file, index) => {
        const normalizedName = normalizeFilenameToNFC(file.name);
        formData.append('files', file, normalizedName);
      });

      // Use agent mode configuration
      const modeConfig = getModeConfiguration('agent', options?.enable_thinking ?? false);
      formData.append('mode', 'agent');
      formData.append('enable_thinking', String(options?.enable_thinking ?? false));
      formData.append('reasoning_effort', modeConfig.reasoning_effort);
      formData.append('enable_context_manager', String(modeConfig.enable_context_manager));
      
      // Add other options
      if (options?.model_name) formData.append('model_name', options.model_name);
      formData.append('stream', String(options?.stream ?? true));

      // Submit the request
      const result = await initiateAgentMutation.mutateAsync({
        formData
      });

      if (result.thread_id) {
        setInitiatedThreadId(result.thread_id);
      } else {
        throw new Error('Agent initiation did not return a thread_id.');
      }
      chatInputRef.current?.clearPendingFiles();
    } catch (error: any) {
      console.error('Error during submission process:', error);
      
      // Handle credit errors with the new banner
      if (handleCreditError(error)) {
        return;
      }
      
      if (error instanceof BillingError) {
        setShowPaymentModal(true);
      } else if (error instanceof AgentRunLimitError) {
        const { running_thread_ids, running_count } = error.detail;
        setAgentLimitData({
          runningCount: running_count,
          runningThreadIds: running_thread_ids,
        });
        setShowAgentLimitDialog(true);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Operation failed';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
      setLocalLoading(false); // Clear local loading state
    }
  };

  // Helper function to get agent configuration
  const getModeConfiguration = (mode: string, thinkingEnabled: boolean) => {
    return {
      enable_context_manager: true,
      reasoning_effort: thinkingEnabled ? 'high' : 'medium',
      enable_thinking: thinkingEnabled,
      max_tokens: 500,
      temperature: 0.3,
      stream: true,
      enable_tools: true,
      enable_search: true,
      response_timeout: 15000,
      chunk_size: 75,
      buffer_size: 150,
      enable_parallel_processing: true,
      skip_initial_validation: false,
      use_fast_model: false,
      cache_responses: true
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Clear any pending prompts from localStorage without setting them
      localStorage.removeItem(PENDING_PROMPT_KEY);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoSubmit && inputValue && !isSubmitting) {
      const timer = setTimeout(() => {
        handleSubmit(inputValue);
        setAutoSubmit(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoSubmit, inputValue, isSubmitting, handleSubmit]);

  // Clean up session storage cache when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('invite_code_usage');
      sessionStorage.removeItem('dashboard_agents');
    };
  }, []);

  return (
    <>
      <BillingModal 
        open={showPaymentModal} 
        onOpenChange={(open) => {
          setShowPaymentModal(open);
          if (!open) {
            setShowPromotionalMessage(false);
          }
        }}
        showUsageLimitAlert={true}
        showPromotionalMessage={showPromotionalMessage}
      />
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal}
        defaultSection="billing"
      />
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Top Right Controls */}
        <div className="absolute py-4 right-3 z-10 flex items-center gap-3 md:right-11">
          {/* Token Usage */}
          <TokenUsage 
            onUpgradeClick={() => setShowPaymentModal(true)} 
            onViewUsageClick={() => setShowSettingsModal(true)}
          />
          
          {/* Theme Toggle Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-9 w-9 flex items-center justify-center cursor-pointer rounded-full border border-black/10 dark:border-muted">
                  <AnimatedThemeToggler className="h-4 w-4 cursor-pointer" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex-1 overflow-y-auto"> 
          <div className="min-h-full flex flex-col">
            {/* Promotional Banner - Only show for users who used invite codes */}
            {!inviteCodeLoading && cachedInviteCodeUsage?.has_used_invite_code && (
              <PromotionalBanner onUpgradeClick={() => {
                setShowPromotionalMessage(true);
                setShowPaymentModal(true);
              }} />
            )}
            
            <div className="flex-1 flex items-center justify-center px-4 -translate-y-8 xl:-translate-y-16">
              <div className="w-full max-w-[800px] flex flex-col items-center justify-center space-y-1">
                <div className="flex flex-col items-center text-center w-full">
                  {/* Time-based greeting with user's name */}
                  {isNameLoaded ? (
                    <div className="tracking-normal text-2xl lg:text-3xl xl:text-3xl font-semibold text-foreground mb-1">
                      {getTimeBasedGreeting()}, {cachedUserName}
                    </div>
                  ) : (
                    <Skeleton className="h-8 w-48 mb-1" />
                  )}
                </div>
                <div className="w-full transition-all duration-700 ease-out">
                  
                  <div className="transition-all duration-700 ease-out">
                    {/* Credit Exhaustion Banner */}
                    {showBanner && (
                      <div className="mb-4">
                        <CreditExhaustionBanner 
                          onUpgrade={() => {
                            // Clear credit exhaustion state when user clicks upgrade
                            clearCreditExhaustion();
                            // Open billing modal
                            setShowPaymentModal(true);
                          }}
                        />
                      </div>
                    )}

                    <ChatInput
                      ref={chatInputRef}
                      onSubmit={handleSubmit}
                      loading={isSubmitting || localLoading} // Use local loading state for immediate feedback
                      placeholder="Assign a task or ask anything..."
                      value={inputValue}
                      onChange={setInputValue}
                      hideAttachments={false}
                      selectedAgentId={selectedAgentId}
                      onAgentSelect={setSelectedAgent}
                      enableAdvancedConfig={true}
                      onConfigureAgent={(agentId) => router.push(`/agents/config/${agentId}`)}
                      disabled={isExhausted}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>        
        
        <BillingErrorAlert
          message={billingError?.message}
          currentUsage={billingError?.currentUsage}
          limit={billingError?.limit}
          accountId={personalAccount?.account_id}
          onDismiss={clearBillingError}
          isOpen={!!billingError}
        />
      </div>

      {agentLimitData && (
        <AgentRunLimitDialog
          open={showAgentLimitDialog}
          onOpenChange={setShowAgentLimitDialog}
          runningCount={agentLimitData.runningCount}
          runningThreadIds={agentLimitData.runningThreadIds}
          projectId={undefined}
        />
      )}
    </>
  );
}
