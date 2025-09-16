'use client';

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { useAgentSelection } from '@/lib/stores/agent-selection-store';

import { Card, CardContent } from '@/components/ui/card';
import { handleFiles } from './file-upload-handler';
import { MessageInput } from './message-input';
import { AttachmentGroup } from '../attachment-group';
import { useModelSelection } from './_use-model-selection';
import { useModeSelection } from './_use-mode-selection';
import { useFileDelete } from '@/hooks/react-query/files';
import { useQueryClient } from '@tanstack/react-query';
import { ToolCallInput } from './floating-tool-preview';
import { ChatSnack,type AgentStatus } from './chat-snack';
import { ArrowDown } from 'lucide-react';

import { IntegrationsRegistry } from '@/components/agents/integrations-registry';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSubscriptionData } from '@/contexts/SubscriptionContext';
import { isLocalMode } from '@/lib/config';
import { BillingModal } from '@/components/billing/billing-modal';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';

export interface ChatInputHandles {
  getPendingFiles: () => File[];
  clearPendingFiles: () => void;
  focus: () => void;
}

export interface ChatInputProps {
  className?: string;
  onSubmit: (
    message: string,
    options?: {
      model_name?: string;
      enable_thinking?: boolean;
      agent_id?: string;
      mode?: 'default' | 'agent';
      enable_context_manager?: boolean;
      reasoning_effort?: string;
    },
  ) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  isAgentRunning?: boolean;
  onStopAgent?: () => void;
  autoFocus?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onFileBrowse?: () => void;
  sandboxId?: string;
  hideAttachments?: boolean;
  selectedAgentId?: string;
  onAgentSelect?: (agentId: string | undefined) => void;
  agentName?: string;
  messages?: any[];
  bgColor?: string;
  toolCalls?: ToolCallInput[];
  toolCallIndex?: number;
  showToolPreview?: boolean;
  onExpandToolPreview?: () => void;
  isLoggedIn?: boolean;
  enableAdvancedConfig?: boolean;
  onConfigureAgent?: (agentId: string) => void;
  hideAgentSelection?: boolean;
  defaultShowSnackbar?: 'tokens' | 'upgrade' | false;
  showToLowCreditUsers?: boolean;
  agentMetadata?: {
    is_helium_default?: boolean;
  };
  showScrollToBottomIndicator?: boolean;
  onScrollToBottom?: () => void;
}

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  localUrl?: string;
}



export const ChatInput = forwardRef<ChatInputHandles, ChatInputProps>(
  (
    {
      onSubmit,
      placeholder = 'Describe what you need help with...',
      loading = false,
      disabled = false,
      isAgentRunning = false,
      onStopAgent,
      autoFocus = true,
      value: controlledValue,
      onChange: controlledOnChange,
      onFileBrowse,
      sandboxId,
      hideAttachments = false,
      selectedAgentId,
      onAgentSelect,
      agentName,
      messages = [],
      bgColor = 'bg-card',
      toolCalls = [],
      toolCallIndex = 0,
      showToolPreview = false,
      onExpandToolPreview,
      isLoggedIn = true,
      enableAdvancedConfig = false,
      onConfigureAgent,
      hideAgentSelection = false,
      defaultShowSnackbar = false,
      showToLowCreditUsers = true,
      agentMetadata,
      showScrollToBottomIndicator = false,
      onScrollToBottom,
      className,
    },
    ref,
  ) => {
    const isControlled =
      controlledValue !== undefined && controlledOnChange !== undefined;
    const router = useRouter();

    const [uncontrolledValue, setUncontrolledValue] = useState('');
    const value = isControlled ? controlledValue : uncontrolledValue;

    const isHeliumAgent = agentMetadata?.is_helium_default || false;

    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [localLoading, setLocalLoading] = useState(false); // Local loading state for immediate feedback

    const [registryDialogOpen, setRegistryDialogOpen] = useState(false);
    const [showSnackbar, setShowSnackbar] = useState(defaultShowSnackbar);
    const [userDismissedUsage, setUserDismissedUsage] = useState(false);
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [wasManuallyStopped, setWasManuallyStopped] = useState(false);
    const [submitTimeout, setSubmitTimeout] = useState<NodeJS.Timeout | null>(null);
    
    const {
      selectedModel,
      setSelectedModel: handleModelChange,
      subscriptionStatus,
      allModels: modelOptions,
      canAccessModel,
      getActualModelId,
      refreshCustomModels,
    } = useModelSelection();

    const {
      selectedMode,
      setSelectedMode: handleModeChange,
      hasInitialized: modeInitialized,
    } = useModeSelection();

    const { data: subscriptionData } = useSubscriptionData();
    const deleteFileMutation = useFileDelete();
    const queryClient = useQueryClient();

    const agentStatus: AgentStatus = (() => {
      if (isAgentRunning || loading) {
        return 'running';
      }
      if (wasManuallyStopped) {
        return 'stopped';
      }
      if (toolCalls && toolCalls.length > 0) {
        return 'completed';
      }
      return 'idle';
    })();
    // Show usage preview logic:
    // - Always show to free users when showToLowCreditUsers is true
    // - For paid users, only show when they're at 70% or more of their cost limit (30% or below remaining)
    const shouldShowUsage = !isLocalMode() && subscriptionData && showToLowCreditUsers && (() => {
      // Free users: always show
      if (subscriptionStatus === 'no_subscription') {
        return true;
      }

      // Paid users: only show when at 70% or more of cost limit
      const currentUsage = subscriptionData.current_usage || 0;
      const costLimit = subscriptionData.cost_limit || 0;

      if (costLimit === 0) return false; // No limit set

      return currentUsage >= (costLimit * 0.7); // 70% or more used (30% or less remaining)
    })();

    // Auto-show usage preview when we have subscription data
    useEffect(() => {
      if (shouldShowUsage && defaultShowSnackbar !== false && !userDismissedUsage && (showSnackbar === false || showSnackbar === defaultShowSnackbar)) {
        setShowSnackbar('upgrade');
      } else if (!shouldShowUsage && showSnackbar !== false) {
        setShowSnackbar(false);
      }
    }, [subscriptionData, showSnackbar, defaultShowSnackbar, shouldShowUsage, subscriptionStatus, showToLowCreditUsers, userDismissedUsage]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: agentsResponse } = useAgents({}, { enabled: isLoggedIn });
    const agents = agentsResponse?.agents || [];

    const { initializeFromAgents } = useAgentSelection();
    useImperativeHandle(ref, () => ({
      getPendingFiles: () => pendingFiles,
      clearPendingFiles: () => setPendingFiles([]),
      focus: () => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      },
    }));

    useEffect(() => {
      if (agents.length > 0 && !onAgentSelect) {
        initializeFromAgents(agents);
      }
    }, [agents, onAgentSelect, initializeFromAgents]);

    useEffect(() => {
      const setPromptValue = (prompt: string) => {
        if (!prompt) return;
        
        if (isControlled && controlledOnChange) {
          controlledOnChange(prompt);
        } else {
          setUncontrolledValue(prompt);
        }
        
        // Focus the input after a short delay and set cursor to end
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const length = prompt.length;
            textareaRef.current.setSelectionRange(length, length);
          }
        }, 100);
      };
      
      // Check for prompt in URL search params
      const checkUrlForPrompt = () => {
        if (typeof window === 'undefined') return false;
        
        // Check URL search params first (newer approach)
        const urlParams = new URLSearchParams(window.location.search);
        const promptFromSearch = urlParams.get('prompt');
        
        if (promptFromSearch) {
          const prompt = decodeURIComponent(promptFromSearch);
          setPromptValue(prompt);
          
          // Clean up the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('prompt');
          window.history.replaceState({}, '', newUrl.toString());
          return true;
        }
        
        // Check URL hash (legacy approach)
        const hash = window.location.hash;
        if (hash.startsWith('#prompt=')) {
          const prompt = decodeURIComponent(hash.replace('#prompt=', ''));
          setPromptValue(prompt);
          
          // Clean up the URL
          const newUrl = new URL(window.location.href);
          newUrl.hash = '';
          window.history.replaceState({}, '', newUrl.toString());
          return true;
        }
        
        return false;
      };
      
      // Handle messages from prompt library
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'PROMPT_SELECTED' && event.data.content) {
          setPromptValue(event.data.content);
        }
      };
      
      // Check for prompt in localStorage
      const checkLocalStorageForPrompt = () => {
        const selectedPrompt = localStorage.getItem('selectedPrompt');
        if (selectedPrompt) {
          try {
            // Try to parse as JSON first
            const promptData = JSON.parse(selectedPrompt);
            // If it has a content field, use that, otherwise use the whole string
            const promptContent = typeof promptData === 'object' && promptData !== null && 'content' in promptData
              ? promptData.content
              : selectedPrompt;
            setPromptValue(promptContent);
          } catch (e) {
            // If not valid JSON, use as is
            setPromptValue(selectedPrompt);
          }
          localStorage.removeItem('selectedPrompt');
          return true;
        }
        return false;
      };
      
      // Try to get prompt from different sources in order
      let promptFound = checkUrlForPrompt();
      if (!promptFound) {
        promptFound = checkLocalStorageForPrompt();
      }
      
      // Set up event listeners
      window.addEventListener('message', handleMessage);
      window.addEventListener('focus', checkLocalStorageForPrompt);
      
      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('focus', checkLocalStorageForPrompt);
      };
    }, [isControlled, controlledOnChange]);

    useEffect(() => {
      if (autoFocus) {
        textareaRef.current?.focus();
      }
    }, [autoFocus, messages]);

    useEffect(() => {
      const handlePromptSelected = (event: Event) => {
        const customEvent = event as CustomEvent<{ content: string }>;
        const promptContent = customEvent.detail?.content;
        if (promptContent) {
          if (isControlled && controlledOnChange) {
            controlledOnChange(promptContent);
          } else {
            setUncontrolledValue(promptContent);
          }
          // Focus the input after setting the prompt
          textareaRef.current?.focus();
        }
      };

      window.addEventListener('promptSelected', handlePromptSelected as EventListener);
      return () => {
        window.removeEventListener('promptSelected', handlePromptSelected as EventListener);
      };
    }, [isControlled, controlledOnChange]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        (!value.trim() && uploadedFiles.length === 0) ||
        loading ||
        (disabled && !isAgentRunning)
      )
        return;

      // Set local loading state immediately for instant feedback
      setLocalLoading(true);

      // Clear any existing timeout
      if (submitTimeout) {
        clearTimeout(submitTimeout);
      }

      // Set immediate loading state with timeout
      const timeout = setTimeout(() => {
        console.warn('Submit operation taking longer than expected');
      }, 5000); // 5 second timeout for immediate feedback
      setSubmitTimeout(timeout);

      try {
        // Submit the message
        setWasManuallyStopped(false);
        let message = value;

        // Process files asynchronously to avoid blocking
        if (uploadedFiles.length > 0) {
          const fileInfo = uploadedFiles
            .map((file) => `[Uploaded File: ${file.path}]`)
            .join('\n');
          message = message ? `${message}\n\n${fileInfo}` : fileInfo;
        }

        // Get model configuration asynchronously
        let baseModelName = getActualModelId(selectedModel);
        let thinkingEnabled = false;
        if (selectedModel.endsWith('-thinking')) {
          baseModelName = getActualModelId(selectedModel.replace(/-thinking$/, ''));
          thinkingEnabled = true;
        }

        // Determine mode-based configuration
        const modeConfig = getModeConfiguration(selectedMode, thinkingEnabled);

        // Track analytics asynchronously to avoid blocking
        setTimeout(() => {
          posthog.capture("task_prompt_submitted", { message });
        }, 0);

        // Submit the message
        onSubmit(message, {
          agent_id: selectedAgentId,
          model_name: baseModelName,
          mode: selectedMode,  // Add the actual mode parameter
          ...modeConfig,
        });

        // Clear form state
        if (!isControlled) {
          setUncontrolledValue('');
        }
        setUploadedFiles([]);

      } catch (error) {
        console.error('Error in handleSubmit:', error);
      } finally {
        // Clear timeout
        if (submitTimeout) {
          clearTimeout(submitTimeout);
          setSubmitTimeout(null);
        }
        // Clear local loading state
        setLocalLoading(false);
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

    const handleStopAgent = () => {
      if (onStopAgent) {
        onStopAgent();
        setWasManuallyStopped(true);
      }
    };
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      if (isControlled) {
        controlledOnChange(newValue);
      } else {
        setUncontrolledValue(newValue);
      }
    };

    // Auto-switch to agent mode when files are uploaded
    useEffect(() => {
      if (uploadedFiles.length > 0 && selectedMode !== 'agent') {
        handleModeChange('agent');
      }
    }, [uploadedFiles.length, selectedMode, handleModeChange]);

    const handleTranscription = (transcribedText: string) => {
      // Replace the entire input value with the transcribed text
      if (isControlled) {
        controlledOnChange(transcribedText);
      } else {
        setUncontrolledValue(transcribedText);
      }
    };

    const removeUploadedFile = async (index: number) => {
      const fileToRemove = uploadedFiles[index];

      // Clean up local URL if it exists
      if (fileToRemove.localUrl) {
        URL.revokeObjectURL(fileToRemove.localUrl);
      }

      // Remove from local state immediately for responsive UI
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
      if (!sandboxId && pendingFiles.length > index) {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
      }

      // Check if file is referenced in existing chat messages before deleting from server
      const isFileUsedInChat = messages.some(message => {
        const content = typeof message.content === 'string' ? message.content : '';
        return content.includes(`[Uploaded File: ${fileToRemove.path}]`);
      });

      // Only delete from server if file is not referenced in chat history
      if (sandboxId && fileToRemove.path && !isFileUsedInChat) {
        deleteFileMutation.mutate({
          sandboxId,
          filePath: fileToRemove.path,
        }, {
          onError: (error) => {
            console.error('Failed to delete file from server:', error);
          }
        });
      } else {
        // File exists in chat history, don't delete from server
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
    };

    return (
      <div className={`mx-auto w-full max-w-5xl relative ${className || ''}`}>
        <div className="relative">
          <ChatSnack
            toolCalls={toolCalls}
            toolCallIndex={toolCallIndex}
            onExpandToolPreview={onExpandToolPreview}
            agentStatus={agentStatus}
            agentName={agentName}
            showToolPreview={showToolPreview}
            showUsagePreview={showSnackbar}
            subscriptionData={subscriptionData}
            onCloseUsage={() => { setShowSnackbar(false); setUserDismissedUsage(true); }}
            onOpenUpgrade={() => setBillingModalOpen(true)}
            isVisible={showToolPreview || !!showSnackbar}
          />

          {/* Scroll to bottom button */}
          {showScrollToBottomIndicator && onScrollToBottom && (
            <button
              onClick={onScrollToBottom}
              className={`absolute cursor-pointer right-3 z-50 w-8 h-8 rounded-full bg-card border border-border transition-all duration-200 hover:scale-105 flex items-center justify-center ${showToolPreview || !!showSnackbar ? '-top-12' : '-top-5'
                }`}
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <Card
            className={`shadow-none p-0 mt-4 w-full max-w-5xl mx-auto bg-transparent border-none overflow-visible ${enableAdvancedConfig && selectedAgentId ? '' : 'rounded-3xl'} relative z-10`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
              if (fileInputRef.current && e.dataTransfer.files.length > 0) {
                const files = Array.from(e.dataTransfer.files);
                handleFiles(
                  files,
                  sandboxId,
                  setPendingFiles,
                  setUploadedFiles,
                  setIsUploading,
                  messages,
                  queryClient,
                );
              }
            }}
          >
            
            <div className="w-full text-sm flex flex-col justify-between items-start rounded-lg">
              <CardContent className={`w-full p-2 pb-3 border-black/15 dark:border-muted bg-white dark:bg-sidebar rounded-[28px] relative overflow-hidden shadow-md shadow-foreground/5 dark:shadow-sidebar-accent/30 border`}>
                {/* <div className="absolute inset-0 rounded-[inherit] overflow-hidden border">
                  <BorderBeam 
                    duration={6}
                    borderWidth={1}
                    size={220}
                    className="from-transparent via-helium-blue to-transparent"
                  />
                  <BorderBeam 
                    duration={6}
                    borderWidth={1}
                    delay={3}
                    size={220}
                    className="from-transparent via-helium-green to-transparent"
                  />
                </div> */}
                <AttachmentGroup
                  files={uploadedFiles || []}
                  sandboxId={sandboxId}
                  onRemove={removeUploadedFile}
                  layout="inline"
                  maxHeight="180px"
                  showPreviews={true}
                  isChatInput={true}
                />
                <MessageInput
                  ref={textareaRef}
                  value={value}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onTranscription={handleTranscription}
                  placeholder={placeholder}
                  loading={loading || localLoading} // Use local loading state for immediate feedback
                  disabled={disabled}
                  isAgentRunning={isAgentRunning}
                  onStopAgent={handleStopAgent}
                  isDraggingOver={isDraggingOver}
                  uploadedFiles={uploadedFiles}

                  fileInputRef={fileInputRef}
                  isUploading={isUploading}
                  sandboxId={sandboxId}
                  setPendingFiles={setPendingFiles}
                  setUploadedFiles={setUploadedFiles}
                  setIsUploading={setIsUploading}
                  hideAttachments={hideAttachments}
                  messages={messages}

                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  modelOptions={modelOptions}
                  subscriptionStatus={subscriptionStatus}
                  canAccessModel={canAccessModel}
                  refreshCustomModels={refreshCustomModels}
                  isLoggedIn={isLoggedIn}

                  selectedAgentId={selectedAgentId}
                  onAgentSelect={onAgentSelect}
                  hideAgentSelection={hideAgentSelection}
                  selectedMode={selectedMode}
                  onModeChange={handleModeChange}
                  onOpenIntegrations={() => setRegistryDialogOpen(true)}
                  onOpenInstructions={() => router.push(`/agents/config/${selectedAgentId}?tab=configuration&accordion=instructions`)}
                  onOpenKnowledge={() => router.push(`/agents/config/${selectedAgentId}?tab=configuration&accordion=knowledge`)}
                  onOpenTriggers={() => router.push(`/agents/config/${selectedAgentId}?tab=configuration&accordion=triggers`)}
                  onOpenWorkflows={() => router.push(`/agents/config/${selectedAgentId}?tab=configuration&accordion=workflows`)}
                />
              </CardContent>
            </div>
          </Card>

          <Dialog open={registryDialogOpen} onOpenChange={setRegistryDialogOpen}>
            <DialogContent className="p-0 max-w-6xl h-[90vh] overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Integrations</DialogTitle>
              </DialogHeader>
              <IntegrationsRegistry
                showAgentSelector={true}
                selectedAgentId={selectedAgentId}
                onAgentChange={onAgentSelect}
                onToolsSelected={(profileId, selectedTools, appName, appSlug) => {
                  // Save to workflow or perform other action here
                }}
              />
            </DialogContent>
          </Dialog>
          <BillingModal
            open={billingModalOpen}
            onOpenChange={setBillingModalOpen}
          />
          
        </div>
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';