'use client';

import React, { useState, Suspense, useEffect, useRef, useMemo } from 'react';
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

const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

export function DashboardContent() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false); // Local loading state for immediate feedback
  const [autoSubmit, setAutoSubmit] = useState(false);
  const { 
    selectedAgentId, 
    setSelectedAgent, 
    initializeFromAgents,
    getCurrentAgent
  } = useAgentSelection();
  const [initiatedThreadId, setInitiatedThreadId] = useState<string | null>(null);
  const { billingError, handleBillingError, clearBillingError } =
    useBillingError();
  const [showAgentLimitDialog, setShowAgentLimitDialog] = useState(false);
  const [agentLimitData, setAgentLimitData] = useState<{
    runningCount: number;
    runningThreadIds: string[];
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { data: accounts } = useAccounts();
  const { preferredName, isLoading: profileLoading } = useUserProfileWithFallback();
  const personalAccount = accounts?.find((account) => account.personal_account);
  const chatInputRef = useRef<ChatInputHandles>(null);
  const initiateAgentMutation = useInitiateAgentWithInvalidation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Welcome messages that change on refresh
  const welcomeMessages = [
    "What do we tackle first, {name}?",
    "Let's lock in - what's the focus, {name}?",
    "What's the game plan, {name}?",
    "Time to go higher, {name} — what's the move?",
    "Ready to lift off, {name}?",
    "Let's rise above the noise, {name}."
  ];
  
  const welcomeMessage = useMemo(() => {
    // Generate a new random message on each component mount (refresh)
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    return randomMessage;
  }, []); // Empty dependency array - generates new message on each mount

  const [currentWelcomeMessage, setCurrentWelcomeMessage] = useState('');

  // Get user's preferred name or fallback to account name
  const cachedUserName = useMemo(() => {
    // If we have a preferred name from the profile, use it
    if (preferredName && !profileLoading) {
      return preferredName;
    }
    
    // Check localStorage first for cached name
    const cachedName = localStorage.getItem('cached_user_name');
    
    if (cachedName && personalAccount?.name === cachedName) {
      // Return cached capitalized name if it matches current user
      return localStorage.getItem('cached_capitalized_name') || 'there';
    }
    
    // Process and cache new name
    if (personalAccount?.name) {
      const firstName = personalAccount.name.split(' ')[0];
      const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      
      // Cache both original and capitalized names
      localStorage.setItem('cached_user_name', personalAccount.name);
      localStorage.setItem('cached_capitalized_name', capitalizedFirstName);
      
      return capitalizedFirstName;
    }
    
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

  // Fetch agents to get the selected agent's name
  const { data: agentsResponse } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });

  const agents = agentsResponse?.agents || [];
  const selectedAgent = selectedAgentId
    ? agents.find(agent => agent.agent_id === selectedAgentId)
    : null;
      const displayName = selectedAgent?.name || 'Helium';
  const agentAvatar = undefined;
  const isHeliumAgent = selectedAgent?.metadata?.is_helium_default || false;

  const threadQuery = useThreadQuery(initiatedThreadId || '');

  const enabledEnvironment = isStagingMode() || isLocalMode();

  useEffect(() => {
    console.log('🚀 Dashboard effect:', { 
      agentsLength: agents.length, 
      selectedAgentId, 
      agents: agents.map(a => ({ id: a.agent_id, name: a.name, isDefault: a.metadata?.is_helium_default })) 
    });
    
    if (agents.length > 0) {
      console.log('📞 Calling initializeFromAgents');
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
      mode?: 'default' | 'agent';
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

      // Handle mode-based configuration asynchronously
      if (options?.mode) {
        const modeConfig = getModeConfiguration(options.mode, options.enable_thinking);
        formData.append('enable_thinking', String(options.enable_thinking ?? false));
        formData.append('reasoning_effort', modeConfig.reasoning_effort);
        formData.append('enable_context_manager', String(modeConfig.enable_context_manager));
      } else {
        // Fallback to direct options
        if (options?.model_name) formData.append('model_name', options.model_name);
        formData.append('enable_thinking', String(options?.enable_thinking ?? false));
        formData.append('reasoning_effort', options?.reasoning_effort ?? 'low');
        formData.append('stream', String(options?.stream ?? true));
        formData.append('enable_context_manager', String(options?.enable_context_manager ?? false));
      }

      // Submit the request
      const result = await initiateAgentMutation.mutateAsync(formData);

      if (result.thread_id) {
        setInitiatedThreadId(result.thread_id);
      } else {
        throw new Error('Agent initiation did not return a thread_id.');
      }
      chatInputRef.current?.clearPendingFiles();
    } catch (error: any) {
      console.error('Error during submission process:', error);
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

  // Helper function to get mode-based configuration
  const getModeConfiguration = (mode: string, thinkingEnabled: boolean) => {
    switch(mode) {
      case 'default':
        return {
          enable_context_manager: false,
          reasoning_effort: 'minimal',
          enable_thinking: false,
          max_tokens: 100, // Reduced for faster response
          temperature: 0.5, // Lower temperature for more focused responses
          stream: true,
          enable_tools: true,
          enable_search: true,
          response_timeout: 5000, // 5 seconds timeout for ultra-fast response
          chunk_size: 25, // Ultra-small chunks for immediate streaming
          buffer_size: 50, // Smaller buffer for instant display
          // Additional ultra-fast optimizations
          enable_parallel_processing: true,
          skip_initial_validation: true,
          use_fast_model: true,
          cache_responses: true
        };
      case 'agent':
        return {
          enable_context_manager: true,
          reasoning_effort: thinkingEnabled ? 'medium' : 'low', // Reduced reasoning effort
          enable_thinking: thinkingEnabled,
          max_tokens: 500, // Reduced for faster response
          temperature: 0.3,
          stream: true,
          enable_tools: true,
          enable_search: true,
          response_timeout: 15000, // 15 seconds for faster complex tasks
          chunk_size: 75, // Smaller chunks for faster streaming
          buffer_size: 150, // Smaller buffer for faster display
          // Additional optimizations
          enable_parallel_processing: true,
          skip_initial_validation: false,
          use_fast_model: false,
          cache_responses: true
        };
      default:
        return {
          enable_context_manager: false,
          reasoning_effort: 'minimal',
          enable_thinking: false,
          max_tokens: 100,
          temperature: 0.5,
          stream: true,
          enable_tools: true,
          enable_search: true,
          response_timeout: 5000,
          chunk_size: 25,
          buffer_size: 50,
          enable_parallel_processing: true,
          skip_initial_validation: true,
          use_fast_model: true,
          cache_responses: true
        };
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);

      if (pendingPrompt) {
        setInputValue(pendingPrompt);
        setAutoSubmit(true);
      }
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
  }, [autoSubmit, inputValue, isSubmitting]);

  return (
    <>
      <BillingModal 
        open={showPaymentModal} 
        onOpenChange={setShowPaymentModal}
        showUsageLimitAlert={true}
      />
      <div className="flex flex-col h-screen w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            {/* {customAgentsEnabled && (
              <div className="flex justify-center px-4 pt-4 md:pt-8">
                <ReleaseBadge text="Custom Agents, Playbooks, and more!" link="/agents?tab=my-agents" />
              </div>
            )} */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <div className="w-full max-w-[800px] flex flex-col items-center justify-center space-y-1 md:space-y-2">
                <div className="flex flex-col items-center text-center w-full">
                  <div className="tracking-normal text-2xl lg:text-3xl xl:text-3xl font-normal text-foreground/80 libre-baskerville-regular">
                    {profileLoading ? (
                      <span>Loading...</span>
                    ) : (
                      currentWelcomeMessage.split('{name}').map((part, index, array) => {
                        if (index === array.length - 1) {
                          return part;
                        }
                        return (
                          <span key={index}>
                            {part}
                            <span>{cachedUserName}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="w-full">
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
                  />
                </div>
              </div>
            </div>
            {/* {enabledEnvironment && customAgentsEnabled && (
              <div className="w-full px-4 pb-8">
                <div className="max-w-7xl mx-auto">
                  <CustomAgentsSection 
                    onAgentSelect={setSelectedAgent}
                  />
                </div>
              </div>
            )} */}
          </div>
        </div>
        
        {/* Disclaimer text at bottom */}
        <div className="flex-shrink-0 px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Helium can make mistakes. Check important info. See Cookie Preferences.
          </p>
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
