import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditExhaustionBanner } from '@/components/billing/credit-exhaustion-banner';
import { BillingModal } from '@/components/billing/billing-modal';
import { useCreditExhaustion } from '@/hooks/useCreditExhaustion';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import {
  ChatInput,
  ChatInputHandles
} from '@/components/thread/chat-input/chat-input';
import { ThreadContent } from '@/components/thread/content/ThreadContent';
import { UnifiedMessage } from '@/components/thread/types';
import { useInitiateAgentWithInvalidation } from '@/hooks/react-query/dashboard/use-initiate-agent';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAddUserMessageMutation } from '@/hooks/react-query/threads/use-messages';
import { useStartAgentMutation, useStopAgentMutation } from '@/hooks/react-query/threads/use-agent-run';
import { BillingError } from '@/lib/api';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';
import { HeliumLogo } from '../sidebar/helium-logo';
import { toast } from 'sonner';

interface Agent {
  agent_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  configured_mcps: Array<{ name: string; qualifiedName: string; config: any; enabledTools?: string[] }>;
  agentpress_tools: Record<string, { enabled: boolean; description: string }>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
  profile_image_url?: string;
}

interface AgentPreviewProps {
  agent: Agent;
  agentMetadata?: {
    is_helium_default?: boolean;
  };
}

export const AgentPreview = ({ agent, agentMetadata }: AgentPreviewProps) => {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [agentRunId, setAgentRunId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'connecting' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false); // Local loading state for immediate feedback
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  const isHeliumAgent = agentMetadata?.is_helium_default || false;
  
  // Credit exhaustion handling
  const { data: subscriptionData } = useSharedSubscription();
  const {
    isExhausted,
    showBanner,
    handleCreditError,
    clearCreditExhaustion,
    hideBanner,
  } = useCreditExhaustion({ subscriptionData });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandles>(null);

  const getAgentStyling = () => {
    return {
      avatar: '🤖',
      color: '#6366f1',
    };
  };

  const { avatar, color } = getAgentStyling();

  const agentAvatarComponent = React.useMemo(() => {
    if (isHeliumAgent) {
      return <HeliumLogo size={16} />;
    }
    if (agent.profile_image_url) {
      return (
        <img 
          src={agent.profile_image_url} 
          alt={agent.name}
          className="h-4 w-4 rounded-sm object-cover"
        />
      );
    }
    if (avatar) {
      return <div className="text-base leading-none">{avatar}</div>;
    }
    return <HeliumLogo size={16} />;
  }, [agent.profile_image_url, agent.name, avatar, isHeliumAgent]);

  const initiateAgentMutation = useInitiateAgentWithInvalidation();
  const addUserMessageMutation = useAddUserMessageMutation();
  const startAgentMutation = useStartAgentMutation();
  const stopAgentMutation = useStopAgentMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessageFromStream = useCallback((message: UnifiedMessage) => {
    setMessages((prev) => {
      const messageExists = prev.some((m) => m.message_id === message.message_id);
      if (messageExists) {
        return prev.map((m) => m.message_id === message.message_id ? message : m);
      } else {
        return [...prev, message];
      }
    });
  }, []);

  const handleStreamStatusChange = useCallback((hookStatus: string) => {
    switch (hookStatus) {
      case 'idle':
      case 'completed':
      case 'stopped':
      case 'agent_not_running':
      case 'error':
      case 'failed':
        setAgentStatus('idle');
        setAgentRunId(null);
        break;
      case 'connecting':
        setAgentStatus('connecting');
        break;
      case 'streaming':
        setAgentStatus('running');
        break;
    }
  }, []);

  const handleStreamError = useCallback((errorMessage: string) => {
    console.error(`[PREVIEW] Stream error: ${errorMessage}`);
    if (!errorMessage.toLowerCase().includes('not found') &&
      !errorMessage.toLowerCase().includes('agent run is not running')) {
      toast.error(`Stream Error: ${errorMessage}`);
    }
  }, []);

  const handleStreamClose = useCallback(() => {
  }, []);

  const {
    status: streamHookStatus,
    textContent: streamingTextContent,
    toolCall: streamingToolCall,
    error: streamError,
    agentRunId: currentHookRunId,
    startStreaming,
    stopStreaming,
  } = useAgentStream(
    {
      onMessage: handleNewMessageFromStream,
      onStatusChange: handleStreamStatusChange,
      onError: handleStreamError,
      onClose: handleStreamClose,
    },
    threadId || '',
    setMessages,
    agent.agent_id,
  );

  useEffect(() => {
    if (agentRunId && agentRunId !== currentHookRunId && threadId) {
      startStreaming(agentRunId);
    }
  }, [agentRunId, startStreaming, currentHookRunId, threadId]);

  useEffect(() => {
    if (streamingTextContent) {
      scrollToBottom();
    }
  }, [streamingTextContent]);

  // Detect assistant denial message and show as popup
  useEffect(() => {
    const DENIAL_TEXT = "I cannot comply with this request. It appears to be a security violation or unsafe instruction. I'm designed to help with legitimate tasks while maintaining safety and ethical boundaries.";

    const extractText = (raw: any): string => {
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.content === 'string') return parsed.content;
        } catch {}
        return raw;
      }
      return '';
    };

    const pickVariant = (seedSource: string): string => {
      return DENIAL_TEXT;
    };

    // Check latest assistant message
    const lastAssistant = [...messages].reverse().find(m => m.type === 'assistant');
    const lastAssistantText = lastAssistant ? extractText(lastAssistant.content) : '';

    const matchesDenial = (text: string) =>
      !!text && text.toLowerCase().includes(DENIAL_TEXT.toLowerCase());

    if (matchesDenial(lastAssistantText)) {
      return;
    }

    // Also check streaming text while it is coming in
    if (matchesDenial(streamingTextContent || '')) {
      return;
    }
  }, [messages, streamingTextContent]);

  const handleSubmitFirstMessage = async (
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
    if (!message.trim() && !chatInputRef.current?.getPendingFiles().length) return;
    
    // Set loading state immediately
    setIsSubmitting(true);
    setLocalLoading(true); // Set local loading state for instant feedback
    setHasStartedConversation(true);

    try {
      // Process files asynchronously to avoid blocking
      const files = chatInputRef.current?.getPendingFiles() || [];

      // Create FormData asynchronously
      const formData = new FormData();
      formData.append('prompt', message);
      formData.append('agent_id', agent.agent_id);

      // Process files asynchronously
      files.forEach((file, index) => {
        const normalizedName = normalizeFilenameToNFC(file.name);
        formData.append('files', file, normalizedName);
      });

      // Handle mode-based configuration asynchronously
      if (options?.mode) {
        const modeConfig = getModeConfiguration(options.mode, options.enable_thinking ?? false);
        formData.append('mode', options.mode);
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
      const result = await initiateAgentMutation.mutateAsync({
        formData,
        mode: options?.mode
      });

      if (result.thread_id) {
        setThreadId(result.thread_id);
        if (result.agent_run_id) {
          setAgentRunId(result.agent_run_id);
        } else {
          try {
            const agentResult = await startAgentMutation.mutateAsync({
              threadId: result.thread_id,
              options
            });
            setAgentRunId(agentResult.agent_run_id);
          } catch (startError) {
            console.error('[PREVIEW] Error starting agent manually:', startError);
            toast.error('Failed to start agent');
          }
        }
        const userMessage: UnifiedMessage = {
          message_id: `user-${Date.now()}`,
          thread_id: result.thread_id,
          type: 'user',
          is_llm_message: false,
          content: message,
          metadata: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMessages([userMessage]);
      }

      chatInputRef.current?.clearPendingFiles();
      setInputValue('');
    } catch (error: any) {
      console.error('[PREVIEW] Error during initiation:', error);
      if (error instanceof BillingError) {
        toast.error('Billing limit reached. Please upgrade your plan.');
      } else {
        toast.error('Failed to start conversation');
      }
      setHasStartedConversation(false);
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

  const handleSubmitMessage = useCallback(
    async (
      message: string,
      options?: { model_name?: string; enable_thinking?: boolean },
    ) => {
      if (!message.trim() || !threadId) return;
      
      setIsSubmitting(true);

      const optimisticUserMessage: UnifiedMessage = {
        message_id: `temp-${Date.now()}`,
        thread_id: threadId,
        type: 'user',
        is_llm_message: false,
        content: message,
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setInputValue('');

      try {
        const messagePromise = addUserMessageMutation.mutateAsync({
          threadId,
          message
        });

        const agentPromise = startAgentMutation.mutateAsync({
          threadId,
          options
        });

        const results = await Promise.allSettled([messagePromise, agentPromise]);

        if (results[0].status === 'rejected') {
          throw new Error(`Failed to send message: ${results[0].reason?.message || results[0].reason}`);
        }

        if (results[1].status === 'rejected') {
          const error = results[1].reason;
          if (error instanceof BillingError) {
            // Handle credit exhaustion with the new banner
            handleCreditError(error);
            setMessages(prev => prev.filter(m => m.message_id !== optimisticUserMessage.message_id));
            return;
          }
          throw new Error(`Failed to start agent: ${error?.message || error}`);
        }

        const agentResult = results[1].value;
        setAgentRunId(agentResult.agent_run_id);

      } catch (err) {
        console.error('[PREVIEW] Error sending message:', err);
        
        // Handle credit errors with the new banner
        if (handleCreditError(err)) {
          setMessages((prev) => prev.filter((m) => m.message_id !== optimisticUserMessage.message_id));
          return;
        }
        
        toast.error(err instanceof Error ? err.message : 'Operation failed');
        setMessages((prev) => prev.filter((m) => m.message_id !== optimisticUserMessage.message_id));
      } finally {
        setIsSubmitting(false);
      }
    },
    [threadId, addUserMessageMutation, startAgentMutation],
  );

  const handleStopAgent = useCallback(async () => {
    setAgentStatus('idle');
    await stopStreaming();

    if (agentRunId) {
      try {
        await stopAgentMutation.mutateAsync(agentRunId);
      } catch (error) {
        console.error('[PREVIEW] Error stopping agent:', error);
      }
    }
  }, [stopStreaming, agentRunId, stopAgentMutation]);

  const handleToolClick = useCallback((assistantMessageId: string | null, toolName: string) => {
    toast.info(`Tool: ${toolName} (Preview mode - tool details not available)`);
  }, []);


  return (
    <div className="h-full flex flex-col bg-muted dark:bg-muted/30">
      <div className="flex-shrink-0 flex items-center gap-3 px-8 py-8">
        <div className="flex-1">
        </div>
        <Badge variant="highlight" className="text-sm">Preview Mode</Badge>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          <ThreadContent
            messages={messages}
            streamingTextContent={streamingTextContent}
            streamingToolCall={streamingToolCall}
            agentStatus={agentStatus}
            handleToolClick={handleToolClick}
            handleOpenFileViewer={() => { }}
            streamHookStatus={streamHookStatus}
            isPreviewMode={true}
            agentName={agent.name}
            agentAvatar={agentAvatarComponent}
            agentMetadata={agentMetadata}
            agentData={agent}
            emptyStateComponent={
              <div className="flex flex-col items-center text-center text-muted-foreground/80">
                <div className="flex w-20 aspect-square items-center justify-center rounded-2xl bg-muted-foreground/10 p-4 mb-4">
                  {isHeliumAgent ? (
                    <HeliumLogo size={36} />
                  ) : agent.profile_image_url ? (
                    <img 
                      src={agent.profile_image_url} 
                      alt={agent.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="text-4xl">{avatar}</div>
                  )}
                </div>
                <p className='w-[60%] text-2xl mb-3'>Start conversation with <span className='text-primary/80 font-semibold'>{agent.name}</span></p>
                <p className='w-[70%] text-sm text-muted-foreground/60'>Test your agent's configuration and chat back and forth to see how it performs with your current settings, tools, and knowledge base.</p>
              </div>
            }
          />
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="px-8 md:pb-4">
          <div className="w-full">
            {/* Credit Exhaustion Banner */}
            {showBanner && (
              <div className="mb-4">
                <CreditExhaustionBanner 
                  onUpgrade={() => {
                    // Clear credit exhaustion state when user clicks upgrade
                    clearCreditExhaustion();
                    // Open billing modal
                    setShowBillingModal(true);
                  }}
                />
              </div>
            )}
            
            <ChatInput
              ref={chatInputRef}
              onSubmit={threadId ? handleSubmitMessage : handleSubmitFirstMessage}
              loading={isSubmitting || localLoading} // Use local loading state for immediate feedback
              placeholder={`Message ${agent.name || 'agent'}...`}
              value={inputValue}
              onChange={setInputValue}
              disabled={isSubmitting || isExhausted}
              isAgentRunning={agentStatus === 'running' || agentStatus === 'connecting'}
              onStopAgent={handleStopAgent}
              agentName={agent.name}
              hideAttachments={false}
              bgColor='bg-muted-foreground/10'
              selectedAgentId={agent.agent_id}
              onAgentSelect={() => {
                toast.info("You can only test the agent you are currently configuring");
              }}
            />
          </div>
        </div>
      </div>
      
      <BillingModal
        open={showBillingModal}
        onOpenChange={setShowBillingModal}
      />
    </div>
  );
};