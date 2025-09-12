'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useContext,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { BillingError, AgentRunLimitError } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/thread/chat-input/chat-input';
import { useSidebar } from '@/components/ui/sidebar';
import { useAgentStream } from '@/hooks/useAgentStream';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { isLocalMode } from '@/lib/config';
import { ThreadContent } from '@/components/thread/content/ThreadContent';
import { ThreadSkeleton } from '@/components/thread/content/ThreadSkeleton';
import { useAddUserMessageMutation } from '@/hooks/react-query/threads/use-messages';
import {
  useStartAgentMutation,
  useStopAgentMutation,
} from '@/hooks/react-query/threads/use-agent-run';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionStatus } from '@/components/thread/chat-input/_use-model-selection';

import {
  UnifiedMessage,
  ApiMessageType,
  ToolCallInput,
  Project,
} from '../_types';
import {
  useThreadData,
  useToolCalls,
  useBilling,
  useKeyboardShortcuts,
} from '../_hooks';
import { ThreadError, UpgradeDialog, ThreadLayout } from '../_components';
import { LayoutContext } from '@/components/dashboard/layout-content';

import {
  useThreadAgent,
  useAgents,
} from '@/hooks/react-query/agents/use-agents';
import { AgentRunLimitDialog } from '@/components/thread/agent-run-limit-dialog';
import { useAgentSelection } from '@/lib/stores/agent-selection-store';
import { useQueryClient } from '@tanstack/react-query';
import { threadKeys } from '@/hooks/react-query/threads/keys';
import { useProjectRealtime } from '@/hooks/useProjectRealtime';
import { useUsageRealtime } from '@/hooks/useUsageRealtime';
import { useAuth } from '@/components/AuthProvider';
import { CreditExhaustionBanner } from '@/components/billing/credit-exhaustion-banner';
import { useCreditExhaustion } from '@/hooks/useCreditExhaustion';

export default function ThreadPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    threadId: string;
  }>;
}) {
  const unwrappedParams = React.use(params);
  const { projectId, threadId } = unwrappedParams;
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSidebarOverlaying } = useContext(LayoutContext);
  

  // Enable real-time updates for usage data
  useUsageRealtime(user?.id);

  // State
  const [newMessage, setNewMessage] = useState('');
  
  // Check for prompt in URL when component mounts
  useEffect(() => {
    // First, check URL parameters
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl) {
      const decodedPrompt = decodeURIComponent(promptFromUrl);
      setNewMessage(decodedPrompt);
      
      // Clean up the URL without causing a re-render
      const cleanUrl = () => {
        const newUrl = new URL(window.location.href);
        if (newUrl.searchParams.has('prompt')) {
          newUrl.searchParams.delete('prompt');
          window.history.replaceState({}, '', newUrl.toString());
        }
      };
      
      // Clean up the URL after a short delay to ensure the message is set
      const timer = setTimeout(cleanUrl, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  const [isSending, setIsSending] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileToView, setFileToView] = useState<string | null>(null);
  const [filePathList, setFilePathList] = useState<string[] | undefined>(
    undefined,
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [initialPanelOpenAttempted, setInitialPanelOpenAttempted] =
    useState(false);
  // Use Zustand store for agent selection persistence
  const {
    selectedAgentId,
    setSelectedAgent,
    initializeFromAgents,
    getCurrentAgent,
  } = useAgentSelection();
  
  const { data: agentsResponse } = useAgents();
  const agents = agentsResponse?.agents || [];
  const [isSidePanelAnimating, setIsSidePanelAnimating] = useState(false);
  const [userInitiatedRun, setUserInitiatedRun] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showAgentLimitDialog, setShowAgentLimitDialog] = useState(false);
  const [agentLimitData, setAgentLimitData] = useState<{
    runningCount: number;
    runningThreadIds: string[];
  } | null>(null);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const [fileViewerWidth, setFileViewerWidth] = useState<number | null>(null);
  
  // Track when we are intentionally opening the file viewer so exclusivity effect doesn't fight it
  const isOpeningFileViewerRef = useRef(false);

  // Refs - simplified for flex-column-reverse
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const initialLayoutAppliedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sidebar
  const { state: leftSidebarState, setOpen: setLeftSidebarOpen } = useSidebar();

  // Custom hooks
  const {
    messages,
    setMessages,
    project,
    sandboxId,
    projectName,
    agentRunId,
    setAgentRunId,
    agentStatus,
    setAgentStatus,
    isLoading,
    error,
    initialLoadCompleted,
    threadQuery,
    messagesQuery,
    projectQuery,
    agentRunsQuery,
  } = useThreadData(threadId, projectId);

  // Credit exhaustion handling (after messages are available)
  const {
    isExhausted,
    showBanner,
    handleCreditError,
    clearCreditExhaustion,
    hideBanner,
  } = useCreditExhaustion({
    onAddCreditExhaustionMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    messages, // Pass messages to check for existing credit exhaustion
  });

  // Handle errors from useThreadData after handleCreditError is available
  useEffect(() => {
    if (error) {
      handleCreditError(error, threadId);
    }
  }, [error, handleCreditError, threadId]);

  const {
    toolCalls,
    setToolCalls,
    currentToolIndex,
    setCurrentToolIndex,
    isSidePanelOpen,
    setIsSidePanelOpen,
    autoOpenedPanel,
    setAutoOpenedPanel,
    externalNavIndex,
    setExternalNavIndex,
    handleToolClick,
    handleStreamingToolCall,
    toggleSidePanel,
    handleSidePanelNavigate,
    userClosedPanelRef,
  } = useToolCalls(messages, setLeftSidebarOpen, agentStatus);

  const {
    showBillingAlert,
    setShowBillingAlert,
    billingData,
    setBillingData,
    checkBillingLimits,
    billingStatusQuery,
  } = useBilling(null, agentStatus, initialLoadCompleted);

  // Real-time project updates (for sandbox creation)
  useProjectRealtime(projectId);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isSidePanelOpen,
    setIsSidePanelOpen,
    leftSidebarState,
    setLeftSidebarOpen,
    userClosedPanelRef,
  });

  const addUserMessageMutation = useAddUserMessageMutation();
  const startAgentMutation = useStartAgentMutation();
  const stopAgentMutation = useStopAgentMutation();
  const { data: threadAgentData } = useThreadAgent(threadId);
  const agent = threadAgentData?.agent;
  const workflowId = threadQuery.data?.metadata?.workflow_id;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: threadKeys.agentRuns(threadId) });
    queryClient.invalidateQueries({ queryKey: threadKeys.messages(threadId) });
  }, [threadId, queryClient]);

  useEffect(() => {
    if (agents.length > 0) {
      const threadAgentId = threadAgentData?.agent?.agent_id;
      initializeFromAgents(agents, threadAgentId);
    }
  }, [threadAgentData, agents, initializeFromAgents]);

  const { data: subscriptionData } = useSharedSubscription();
  const subscriptionStatus: SubscriptionStatus =
    subscriptionData?.status === 'active' ||
    subscriptionData?.status === 'trialing'
      ? 'active'
      : 'no_subscription';

  const handleProjectRenamed = useCallback((newName: string) => {}, []);

  // scrollToBottom for flex-column-reverse layout
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleNewMessageFromStream = useCallback(
    (message: UnifiedMessage) => {
      if (!message.message_id) {
        console.warn(
          `[STREAM HANDLER] Received message is missing ID: Type=${message.type}`,
        );
      }

      setMessages((prev) => {
        const messageExists = prev.some(
          (m) => m.message_id === message.message_id,
        );
        if (messageExists) {
          return prev.map((m) =>
            m.message_id === message.message_id ? message : m,
          );
        } else {
          // If this is a user message, replace any optimistic user message with temp ID
          if (message.type === 'user') {
            const optimisticIndex = prev.findIndex(
              (m) =>
                m.type === 'user' &&
                m.message_id?.startsWith('temp-') &&
                m.content === message.content,
            );
            if (optimisticIndex !== -1) {
              // Replace the optimistic message with the real one
              return prev.map((m, index) =>
                index === optimisticIndex ? message : m,
              );
            }
          }
          return [...prev, message];
        }
      });

      if (message.type === 'tool') {
        setAutoOpenedPanel(false);
      }
    },
    [setMessages, setAutoOpenedPanel],
  );

  const handleStreamStatusChange = useCallback(
    (hookStatus: string) => {
      switch (hookStatus) {
        case 'idle':
        case 'completed':
        case 'stopped':
        case 'agent_not_running':
        case 'error':
        case 'failed':
          setAgentStatus('idle');
          setAgentRunId(null);
          setAutoOpenedPanel(false);

          // No scroll needed with flex-column-reverse
          break;
        case 'connecting':
          setAgentStatus('connecting');
          break;
        case 'streaming':
          setAgentStatus('running');
          break;
      }
    },
    [setAgentStatus, setAgentRunId, setAutoOpenedPanel],
  );

  const handleStreamError = useCallback((errorMessage: string) => {
    console.error(`[PAGE] Stream hook error: ${errorMessage}`);
    if (
      !errorMessage.toLowerCase().includes('not found') &&
      !errorMessage.toLowerCase().includes('agent run is not running')
    ) {
      toast.error(`Stream Error: ${errorMessage}`);
    }
  }, []);

  const handleStreamClose = useCallback(() => {}, []);

  const {
    status: streamHookStatus,
    textContent: streamingTextContent,
    toolCall: streamingToolCall,
    error: streamError,
    agentRunId: currentHookRunId,
    startStreaming,
    stopStreaming,
    paused,
    inTakeover,
    pause,
    resume,
    takeover,
    release,
    logManual,
  } = useAgentStream(
    {
      onMessage: handleNewMessageFromStream,
      onStatusChange: handleStreamStatusChange,
      onError: handleStreamError,
      onClose: handleStreamClose,
    },
    threadId,
    setMessages,
    threadAgentData?.agent?.agent_id,
    (error) => handleCreditError(error, threadId), // Pass credit error handler with threadId
  );

  const handleTogglePauseResume = useCallback(async () => {
    try {
      if (paused) {
        await resume();
        await logManual({ event_type: 'resume', description: 'User resumed automation via control' });
      } else if (agentStatus === 'running' || agentStatus === 'connecting') {
        await pause();
        await logManual({ event_type: 'pause', description: 'User paused automation via control' });
      }
    } catch (e) {
      // errors already toasted in hook; no-op
    }
  }, [paused, agentStatus, pause, resume, logManual]);

  const handleToggleTakeoverRelease = useCallback(async () => {
    try {
      if (inTakeover) {
        await release();
        await logManual({ event_type: 'release', description: 'User released manual takeover via control' });
      } else if (agentStatus === 'running' || agentStatus === 'connecting' || paused) {
        await takeover();
        await logManual({ event_type: 'takeover', description: 'User took manual control via control' });
      }
    } catch (e) {
      // errors already toasted
    }
  }, [inTakeover, agentStatus, paused, takeover, release, logManual]);

  // Hotkeys: Space/P to pause/resume, T to takeover/release
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ignore when typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        const isTyping = tag === 'input' || tag === 'textarea' || target.isContentEditable;
        if (isTyping) return;
      }

      // Space or KeyP => toggle pause/resume when applicable
      if ((e.code === 'Space' || e.code === 'KeyP')) {
        e.preventDefault();
        if (agentStatus === 'running' || agentStatus === 'connecting' || paused) {
          handleTogglePauseResume();
        }
      }
      // KeyT => toggle takeover/release
      if (e.code === 'KeyT') {
        e.preventDefault();
        if (agentStatus === 'running' || agentStatus === 'connecting' || paused || inTakeover) {
          handleToggleTakeoverRelease();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [agentStatus, paused, inTakeover, handleTogglePauseResume, handleToggleTakeoverRelease]);

  const handleSubmitMessage = useCallback(
    async (
      message: string,
      options?: { model_name?: string; enable_thinking?: boolean },
    ) => {
      if (!message.trim()) return;
      
      // Prevent submission if credits are exhausted
      if (isExhausted) {
        // Don't add user message or make API calls
        setNewMessage('');
        return;
      }
      
      setIsSending(true);

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
      setNewMessage('');

      try {
        const messagePromise = addUserMessageMutation.mutateAsync({
          threadId,
          message,
        });

        const agentPromise = startAgentMutation.mutateAsync({
          threadId,
          options: {
            ...options,
            agent_id: selectedAgentId,
          },
        });

        const results = await Promise.allSettled([
          messagePromise,
          agentPromise,
        ]);

        if (results[0].status === 'rejected') {
          const reason = results[0].reason;
          console.error('Failed to send message:', reason);
          throw new Error(
            `Failed to send message: ${reason?.message || reason}`,
          );
        }

        if (results[1].status === 'rejected') {
          const error = results[1].reason;
          console.error('Failed to start agent:', error);

          if (error instanceof BillingError) {
            // Handle credit exhaustion with the new banner
            handleCreditError(error, threadId);
            
            setMessages((prev) =>
              prev.filter(
                (m) => m.message_id !== optimisticUserMessage.message_id,
              ),
            );
            return;
          }

          if (error instanceof AgentRunLimitError) {
            const { running_thread_ids, running_count } = error.detail;

            setAgentLimitData({
              runningCount: running_count,
              runningThreadIds: running_thread_ids,
            });
            setShowAgentLimitDialog(true);

            setMessages((prev) =>
              prev.filter(
                (m) => m.message_id !== optimisticUserMessage.message_id,
              ),
            );
            return;
          }

          throw new Error(`Failed to start agent: ${error?.message || error}`);
        }

        const agentResult = results[1].value;
        setUserInitiatedRun(true);
        setAgentRunId(agentResult.agent_run_id);
      } catch (err) {
        console.error('Error sending message or starting agent:', err);
        
        // Handle credit errors with the new banner
        if (handleCreditError(err, threadId)) {
          setMessages((prev) =>
            prev.filter((m) => m.message_id !== optimisticUserMessage.message_id),
          );
          return;
        }
        
        if (
          !(err instanceof BillingError) &&
          !(err instanceof AgentRunLimitError)
        ) {
          toast.error(err instanceof Error ? err.message : 'Operation failed');
        }
        setMessages((prev) =>
          prev.filter((m) => m.message_id !== optimisticUserMessage.message_id),
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      threadId,
      project?.account_id,
      addUserMessageMutation,
      startAgentMutation,
      setMessages,
      setBillingData,
      setShowBillingAlert,
      setAgentRunId,
      isExhausted, // Add isExhausted to dependencies
    ],
  );

  const handleStopAgent = useCallback(async () => {
    setAgentStatus('idle');

    await stopStreaming();

    if (agentRunId) {
      try {
        await stopAgentMutation.mutateAsync(agentRunId);
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }
  }, [stopStreaming, agentRunId, stopAgentMutation, setAgentStatus]);

  const handleOpenFileViewer = useCallback(
    (filePath?: string, filePathList?: string[]) => {
      // Mark that we are intentionally opening the file viewer
      isOpeningFileViewerRef.current = true;

      // Update target file states immediately
      if (filePath) {
        setFileToView(filePath);
      } else {
        setFileToView(null);
      }
      setFilePathList(filePathList);

      // If the tool panel is open, close it first to avoid the mutual-exclusive effect
      // closing the file viewer in the same render frame. Then open the file viewer after
      // the panel begins closing (match the 200ms panel transition used elsewhere).
      if (isSidePanelOpen) {
        // Mark as user-closed to prevent auto-reopen by useToolCalls
        userClosedPanelRef.current = true;
        setIsSidePanelOpen(false);
        setTimeout(() => {
          setFileViewerOpen(true);
          // Clear the intent flag after open
          setTimeout(() => { isOpeningFileViewerRef.current = false; }, 50);
        }, 210);
      } else {
        setFileViewerOpen(true);
        // Clear the intent flag after open
        setTimeout(() => { isOpeningFileViewerRef.current = false; }, 50);
      }
    },
    [isSidePanelOpen, setIsSidePanelOpen],
  );

  const toolViewAssistant = useCallback(
    (assistantContent?: string, toolContent?: string) => {
      if (!assistantContent) return null;

      return (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            Assistant Message
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-xs prose prose-xs dark:prose-invert chat-markdown max-w-none">
              {assistantContent}
            </div>
          </div>
        </div>
      );
    },
    [],
  );

  const toolViewResult = useCallback(
    (toolContent?: string, isSuccess?: boolean) => {
      if (!toolContent) return null;

      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-muted-foreground">
              Tool Result
            </div>
            <div
              className={`px-2 py-0.5 rounded-full text-xs ${
                isSuccess
                  ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}
            >
              {isSuccess ? 'Success' : 'Failed'}
            </div>
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-xs prose prose-xs dark:prose-invert chat-markdown max-w-none">
              {toolContent}
            </div>
          </div>
        </div>
      );
    },
    [],
  );

  // Effects
  useEffect(() => {
    if (!initialLayoutAppliedRef.current) {
      setLeftSidebarOpen(false);
      initialLayoutAppliedRef.current = true;
    }
  }, [setLeftSidebarOpen]);

  useEffect(() => {
    if (initialLoadCompleted && !initialPanelOpenAttempted) {
      setInitialPanelOpenAttempted(true);

      // Only auto-open on desktop, not mobile
      if (!isMobile) {
        if (toolCalls.length > 0) {
          setIsSidePanelOpen(true);
          setCurrentToolIndex(toolCalls.length - 1);
        } else {
          if (messages.length > 0) {
            setIsSidePanelOpen(true);
          }
        }
      }
    }
  }, [
    initialPanelOpenAttempted,
    messages,
    toolCalls,
    initialLoadCompleted,
    setIsSidePanelOpen,
    setCurrentToolIndex,
    isMobile,
  ]);

  useEffect(() => {
    // Start streaming if user initiated a run (don't wait for initialLoadCompleted for first-time users)
    if (agentRunId && agentRunId !== currentHookRunId && userInitiatedRun) {
      startStreaming(agentRunId);
      setUserInitiatedRun(false); // Reset flag after starting
    }
    // Also start streaming if this is from page load with recent active runs
    else if (
      agentRunId &&
      agentRunId !== currentHookRunId &&
      initialLoadCompleted &&
      !userInitiatedRun
    ) {
      startStreaming(agentRunId);
    }
  }, [
    agentRunId,
    startStreaming,
    currentHookRunId,
    initialLoadCompleted,
    userInitiatedRun,
  ]);

  // Mutual exclusivity: if tool panel opens, close file viewer
  useEffect(() => {
    if (isSidePanelOpen && fileViewerOpen && !isOpeningFileViewerRef.current) {
      setFileViewerOpen(false);
    }
  }, [isSidePanelOpen, fileViewerOpen]);

  // No auto-scroll needed with flex-column-reverse

  // No intersection observer needed with flex-column-reverse

  useEffect(() => {
    if (
      (streamHookStatus === 'completed' ||
        streamHookStatus === 'stopped' ||
        streamHookStatus === 'agent_not_running' ||
        streamHookStatus === 'error') &&
      (agentStatus === 'running' || agentStatus === 'connecting')
    ) {
      setAgentStatus('idle');
      setAgentRunId(null);
    }
  }, [streamHookStatus, agentStatus, setAgentStatus, setAgentRunId]);

  // SEO title update
  useEffect(() => {
    if (projectName) {
      document.title = `${projectName} | Helium AI`;

      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `${projectName} - Interactive agent conversation powered by Helium AI`,
        );
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${projectName} | Helium AI`);
      }

      const ogDescription = document.querySelector(
        'meta[property="og:description"]',
      );
      if (ogDescription) {
        ogDescription.setAttribute(
          'content',
          `Interactive AI conversation for ${projectName}`,
        );
      }
    }
  }, [projectName]);

  useEffect(() => {
    const debugParam = searchParams.get('debug');
    setDebugMode(debugParam === 'true');
  }, [searchParams]);

  const hasCheckedUpgradeDialog = useRef(false);

  useEffect(() => {
    if (
      initialLoadCompleted &&
      subscriptionData &&
      !hasCheckedUpgradeDialog.current
    ) {
      hasCheckedUpgradeDialog.current = true;
              const hasSeenUpgradeDialog = localStorage.getItem('helium_upgrade_dialog_displayed');
      const isFreeTier = subscriptionStatus === 'no_subscription';
      if (!hasSeenUpgradeDialog && isFreeTier && !isLocalMode()) {
        setShowUpgradeDialog(true);
      }
    }
  }, [subscriptionData, subscriptionStatus, initialLoadCompleted]);

  const handleDismissUpgradeDialog = () => {
    setShowUpgradeDialog(false);
                localStorage.setItem('helium_upgrade_dialog_displayed', 'true');
  };

  useEffect(() => {
    if (streamingToolCall) {
      handleStreamingToolCall(streamingToolCall);
    }
  }, [streamingToolCall, handleStreamingToolCall]);

  useEffect(() => {
    setIsSidePanelAnimating(true);
    const timer = setTimeout(() => setIsSidePanelAnimating(false), 200); // Match transition duration
    return () => clearTimeout(timer);
  }, [isSidePanelOpen]);

  // Scroll detection for show/hide scroll-to-bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTop = scrollContainerRef.current.scrollTop;
      const scrollHeight = scrollContainerRef.current.scrollHeight;
      const clientHeight = scrollContainerRef.current.clientHeight;
      const threshold = 100;

      // With flex-column-reverse, scrollTop becomes NEGATIVE when scrolling up
      // Show button when scrollTop < -threshold (scrolled up enough from bottom)
      const shouldShow = scrollTop < -threshold && scrollHeight > clientHeight;
      setShowScrollToBottom(shouldShow);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, {
        passive: true,
      });
      // Check initial state
      setTimeout(() => handleScroll(), 100);

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [messages, initialLoadCompleted]);

  if (!initialLoadCompleted || isLoading) {
    return <ThreadSkeleton isSidePanelOpen={isSidePanelOpen} />;
  }

  if (error) {
    return (
      <ThreadLayout
        threadId={threadId}
        projectName={projectName}
        projectId={project?.id || ''}
        project={project}
        sandboxId={sandboxId}
        isSidePanelOpen={isSidePanelOpen}
        setIsSidePanelOpen={setIsSidePanelOpen}
        onToggleSidePanel={toggleSidePanel}
        paused={paused}
        inTakeover={inTakeover}
        onHeaderTakeoverToggle={handleToggleTakeoverRelease}
        onViewFiles={handleOpenFileViewer}
        fileViewerOpen={fileViewerOpen}
        setFileViewerOpen={setFileViewerOpen}
        fileToView={fileToView}
        filePathList={filePathList}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]}
        externalNavIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentToolIndex={currentToolIndex}
        onSidePanelNavigate={handleSidePanelNavigate}
        onSidePanelClose={() => {
          setIsSidePanelOpen(false);
          userClosedPanelRef.current = true;
          setAutoOpenedPanel(true);
        }}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        isLoading={!initialLoadCompleted || isLoading}
        showBillingAlert={showBillingAlert}
        billingData={billingData}
        onDismissBilling={() => setShowBillingAlert(false)}
        debugMode={debugMode}
        isMobile={isMobile}
        initialLoadCompleted={initialLoadCompleted}
        agentName={agent && agent.name}
      >
        <ThreadError error={error} />
      </ThreadLayout>
    );
  }

  return (
    <>
      <ThreadLayout
        threadId={threadId}
        projectName={projectName}
        projectId={project?.id || ''}
        project={project}
        sandboxId={sandboxId}
        isSidePanelOpen={isSidePanelOpen}
        setIsSidePanelOpen={setIsSidePanelOpen}
        onToggleSidePanel={toggleSidePanel}
        paused={paused}
        inTakeover={inTakeover}
        onHeaderTakeoverToggle={handleToggleTakeoverRelease}
        onProjectRenamed={handleProjectRenamed}
        onViewFiles={handleOpenFileViewer}
        fileViewerOpen={fileViewerOpen}
        setFileViewerOpen={setFileViewerOpen}
        fileToView={fileToView}
        filePathList={filePathList}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]}
        externalNavIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentToolIndex={currentToolIndex}
        onSidePanelNavigate={handleSidePanelNavigate}
        onSidePanelClose={() => {
          setIsSidePanelOpen(false);
          userClosedPanelRef.current = true;
          setAutoOpenedPanel(true);
        }}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        isLoading={!initialLoadCompleted || isLoading}
        showBillingAlert={showBillingAlert}
        billingData={billingData}
        onDismissBilling={() => setShowBillingAlert(false)}
        debugMode={debugMode}
        isMobile={isMobile}
        initialLoadCompleted={initialLoadCompleted}
        agentName={agent && agent.name}
        disableInitialAnimation={!initialLoadCompleted && toolCalls.length > 0}
        onLogManual={async (payload) => {
          try {
            await logManual(payload);
          } catch {}
        }}
        onPanelWidthChange={setPanelWidth}
        onFileViewerWidthChange={setFileViewerWidth}
      >
        {/* {workflowId && (
          <div className="px-4 pt-4">
            <WorkflowInfo workflowId={workflowId} />
          </div>
        )} */}
        
        <ThreadContent
          messages={messages}
          isSidePanelOpen={isSidePanelOpen}
          streamingTextContent={streamingTextContent}
          streamingToolCall={streamingToolCall}
          agentStatus={agentStatus}
          handleToolClick={handleToolClick}
          handleOpenFileViewer={handleOpenFileViewer}
          readOnly={false}
          streamHookStatus={streamHookStatus}
          sandboxId={sandboxId}
          project={project}
          debugMode={debugMode}
          agentName={agent && agent.name}
          agentAvatar={undefined}
          agentMetadata={agent?.metadata}
          agentData={agent}
          onSubmit={handleSubmitMessage}
          onCreditExhaustionUpgrade={() => {
            // Clear credit exhaustion state when user clicks upgrade
            clearCreditExhaustion();
          }}
        />

        {/* Disclaimer text between content and chat input */}
        <div
          className={cn(
            'px-4 text-center',
            'transition-[left,right] duration-200 ease-in-out will-change-[left,right]',
          )}
        >
          <div className="max-w-[100vw] overflow-x-auto whitespace-nowrap">
            <p className="text-xs text-muted-foreground bg-background backdrop-blur-sm rounded-lg px-3 inline-block">
              Helium can make mistakes. 
              Check important info. See Cookie Preferences.
            </p>
          </div>
        </div>

        {/* Automation control banners */}
        {(paused || inTakeover) && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 rounded-full border bg-background/95 backdrop-blur px-3 py-1.5 shadow">
              <span className="text-xs text-muted-foreground">
                {inTakeover ? 'Manual takeover active' : 'Automation paused'}
              </span>
              <div className="flex items-center gap-1">
                {paused && (
                  <Button size="sm" variant="secondary" onClick={handleTogglePauseResume} className="h-7">
                    Resume (Space/P)
                  </Button>
                )}
                {inTakeover ? (
                  <Button size="sm" variant="secondary" onClick={handleToggleTakeoverRelease} className="h-7">
                    Release (T)
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={handleToggleTakeoverRelease} className="h-7">
                    Takeover (T)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}


        <div
          className={cn(
            'fixed bottom-6 z-20  bg-gradient-to-t from-background via-background/90 to-transparent pt-0',
            'transition-[left,right] duration-200 ease-in-out will-change-[left,right]',
            {
              'left-0 right-0 pb-3': isMobile,
              'left-[72px] md:left-[256px] right-0': leftSidebarState === 'expanded' && !isMobile && !isSidebarOverlaying,
              'left-[53px] right-0': (isSidePanelOpen || fileViewerOpen) && !isMobile && leftSidebarState !== 'expanded',
              'left-10 right-0': (!isSidePanelOpen && !fileViewerOpen && !isMobile) || (leftSidebarState === 'expanded' && isSidebarOverlaying),
            }
          )}
          style={
            ((isSidePanelOpen && panelWidth) || (fileViewerOpen && fileViewerWidth)) && !isMobile
              ? {
                  right: `${isSidePanelOpen ? panelWidth : fileViewerWidth}px`,
                  paddingRight: '1.4rem', // Add padding when panel is open
                }
              : undefined
          }
        >
         <div
            className={cn(
              'flex justify-center px-0',
              isMobile ? 'px-3' : 'px-8',
              'flex justify-center w-full',
              isMobile ? 'px-3' : 'px-6',
              (isSidePanelOpen || fileViewerOpen) && !isMobile && 'pr-0' // Remove right padding when panel is open since we're adding it to the parent
            )}
          >
            <div
              className={cn(
                'w-full',
                isSidePanelOpen ? 'max-w-4xl' : 'max-w-4xl',
                'w-full max-w-4xl',
                (isSidePanelOpen || fileViewerOpen) && !isMobile && 'pr-6' // Add right padding to the content when any right panel open
              )}
              style={{
                transition: 'padding 0.2s ease-in-out',
              }}
            >
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSubmit={handleSubmitMessage}
                placeholder={`Assign tasks or ask anything...`}
                loading={isSending}
                disabled={
                  isSending ||
                  agentStatus === 'running' ||
                  agentStatus === 'connecting' ||
                  isExhausted
                }
                isAgentRunning={
                  agentStatus === 'running' || agentStatus === 'connecting'
                }
                onStopAgent={handleStopAgent}
                autoFocus={!isLoading}
                onFileBrowse={handleOpenFileViewer}
                sandboxId={sandboxId || undefined}
                messages={messages}
                agentName={agent && agent.name}
                selectedAgentId={selectedAgentId}
                onAgentSelect={setSelectedAgent}
                toolCalls={toolCalls}
                toolCallIndex={currentToolIndex}
                showToolPreview={!isSidePanelOpen && toolCalls.length > 0}
                onExpandToolPreview={() => {
                  setIsSidePanelOpen(true);
                  userClosedPanelRef.current = false;
                }}
                // defaultShowSnackbar="tokens"
                showScrollToBottomIndicator={showScrollToBottom}
                onScrollToBottom={scrollToBottom}
              />
            </div>
          </div>
        </div>
      </ThreadLayout>

      {/* <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onDismiss={handleDismissUpgradeDialog}
      /> */}

      {/* {agentLimitData && (
        <AgentRunLimitDialog
          open={showAgentLimitDialog}
          onOpenChange={setShowAgentLimitDialog}
          runningCount={agentLimitData.runningCount}
          runningThreadIds={agentLimitData.runningThreadIds}
          projectId={projectId}
        />
      )} */}
    </>
  );
}
