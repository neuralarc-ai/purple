'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { CircleDashed, X, Minimize2, SkipForward, SkipBack, Wrench, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ToolView, extractFilePathFromToolCall } from './tool-views/wrapper';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useMediumScreen } from '@/hooks/react-query/use-medium-screen';
import { useCustomBreakpoint } from '@/hooks/use-custom-breakpoints';
import { ToolCallSidePanelContext } from '@/components/ui/sidebar';

export interface ToolCallInput {
  assistantCall: {
    content?: string;
    name?: string;
    timestamp?: string;
  };
  toolResult?: {
    content?: string;
    isSuccess?: boolean;
    timestamp?: string;
  };
  messages?: ApiMessageType[];
}

interface ToolCallSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  externalNavigateToIndex?: number;
  messages?: ApiMessageType[];
  agentStatus: string;
  project?: Project;
  renderAssistantMessage?: (
    assistantContent?: string,
    toolContent?: string,
  ) => React.ReactNode;
  renderToolResult?: (
    toolContent?: string,
    isSuccess?: boolean,
  ) => React.ReactNode;
  isLoading?: boolean;
  agentName?: string;
  onFileClick?: (filePath: string) => void;
  disableInitialAnimation?: boolean;
  // When the left sidebar is expanded, slightly reduce the panel width to free up space
  isLeftSidebarExpanded?: boolean;
  // Reset accumulated time when starting a new thread
  resetAccumulatedTime?: boolean;
  // Thread ID for fetching runtime from database
  threadId?: string;
  // Agent run ID for current execution
  agentRunId?: string;
  // Callback when panel width changes
  onPanelWidthChange?: (width: number | null) => void;
}

interface ToolCallSnapshot {
  id: string;
  toolCall: ToolCallInput;
  index: number;
  timestamp: number;
}

const FLOATING_LAYOUT_ID = 'tool-panel-float';
const CONTENT_LAYOUT_ID = 'tool-panel-content';

interface ViewToggleProps {
  currentView: 'tools' | 'browser';
  onViewChange: (view: 'tools' | 'browser') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="relative flex items-center gap-1 bg-muted rounded-3xl px-1 py-1">
      {/* Sliding background */}
      <motion.div
        className="absolute h-7 w-7 bg-white rounded-xl shadow-sm"
        initial={false}
        animate={{
          x: currentView === 'tools' ? 0 : 32, // 28px button width + 4px gap
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      />

      {/* Buttons */}
      <Button
        size="sm"
        onClick={() => onViewChange('tools')}
        className={`relative z-10 h-7 w-7 p-0 rounded-xl bg-transparent hover:bg-transparent shadow-none ${currentView === 'tools'
          ? 'text-black'
          : 'text-gray-500 dark:text-gray-400'
          }`}
        title="Switch to Tool View"
      >
        <Wrench className="h-3.5 w-3.5" />
      </Button>

      <Button
        size="sm"
        onClick={() => onViewChange('browser')}
        className={`relative z-10 h-7 w-7 p-0 rounded-xl bg-transparent hover:bg-transparent shadow-none ${currentView === 'browser'
          ? 'text-black'
          : 'text-gray-500 dark:text-gray-400'
          }`}
        title="Switch to Browser View"
      >
        <Globe className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// Helper function to generate the computer title
const getComputerTitle = (agentName?: string): string => {
  return agentName ? `${agentName}'s Computer` : "Helium's Computer";
};

// Reusable header component for the tool panel
interface PanelHeaderProps {
  agentName?: string;
  onClose: () => void;
  isStreaming?: boolean;
  variant?: 'drawer' | 'desktop' | 'motion';
  showMinimize?: boolean;
  hasToolResult?: boolean;
  layoutId?: string;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  agentName,
  onClose,
  isStreaming = false,
  variant = 'desktop',
  showMinimize = false,
  hasToolResult = false,
  layoutId,
}) => {
  const title = getComputerTitle(agentName);

  if (variant === 'drawer') {
    return (
      <DrawerHeader className="pb-2">
        <div className="flex items-center justify-between">
          <DrawerTitle className="text-lg font-medium">
            {title}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            title="Minimize to floating preview"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>
    );
  }

  if (variant === 'motion') {
    return (
      <motion.div
        layoutId={layoutId}
        className="p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div layoutId="tool-icon" className="ml-2">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming && (
              <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1.5">
                <CircleDashed className="h-3 w-3 animate-spin" />
                <span>Running</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              title="Minimize to floating preview"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="pt-4 pl-4 pr-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="ml-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <Badge variant="outline" className="gap-1.5 p-2 rounded-3xl">
              <CircleDashed className="h-3 w-3 animate-spin" />
              <span>Running</span>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            title={showMinimize ? "Minimize to floating preview" : "Close"}
          >
            {showMinimize ? <Minimize2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export function ToolCallSidePanel({
  isOpen,
  onClose,
  toolCalls,
  currentIndex,
  onNavigate,
  messages,
  agentStatus,
  project,
  isLoading = false,
  externalNavigateToIndex,
  agentName,
  onFileClick,
  disableInitialAnimation,
  isLeftSidebarExpanded = false,
  resetAccumulatedTime = false,
  threadId,
  agentRunId,
  onPanelWidthChange,
}: ToolCallSidePanelProps) {
  const { setIsExpanded } = React.useContext(ToolCallSidePanelContext);
  const [hasOpened, setHasOpened] = React.useState(false);
  const [dots, setDots] = React.useState('');
  const [internalIndex, setInternalIndex] = React.useState(0);
  const [navigationMode, setNavigationMode] = React.useState<'live' | 'manual'>('live');
  const [toolCallSnapshots, setToolCallSnapshots] = React.useState<ToolCallSnapshot[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [agentStartTime, setAgentStartTime] = React.useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [finalRuntime, setFinalRuntime] = React.useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = React.useState(0);
  const [databaseRuntime, setDatabaseRuntime] = React.useState<number>(0);
  const [isLoadingRuntime, setIsLoadingRuntime] = React.useState(false);
  const [generatedAgentRunId, setGeneratedAgentRunId] = React.useState<string | null>(null);

  const isMobile = useIsMobile();
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const isMediumScreen = useMediumScreen();
  const isCustomBreakpoint = useCustomBreakpoint();
  const [isResizing, setIsResizing] = React.useState(false);
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);
  // Initialize panel width based on screen size
  const getInitialPanelWidth = () => {
    if (typeof window === 'undefined') return 480; // Default server-side

    const screenWidth = window.innerWidth;

    // Default to 50% width for all screen sizes to maintain 50-50 split
    return Math.floor(screenWidth * 0.45);
  };

  const [panelWidth, setPanelWidth] = React.useState<number | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const minWidth = 360;
  const maxWidth = typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.7) : 1000; // 70% of viewport width
  const defaultWidth = 480;

  // Initialize panel width and screen size on client side only
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (panelWidth === null) {
        setPanelWidth(getInitialPanelWidth());
      }
      // Initialize small screen state
      setIsSmallScreen(window.innerWidth < 768);
    }
  }, []);

  // Debounced callback to parent to reduce excessive notifications
  const debouncedPanelWidthChange = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (width: number | null) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (onPanelWidthChange) {
            onPanelWidthChange(width);
          }
        }, 50); // 50ms debounce
      };
    }, [onPanelWidthChange]),
    [onPanelWidthChange]
  );

  // Notify parent when panel width changes (debounced for performance)
  React.useEffect(() => {
    if (!isResizing) {
      debouncedPanelWidthChange(panelWidth);
    }
  }, [panelWidth, isResizing, debouncedPanelWidthChange]);

  // Handle window resize to update max width (70% of viewport)
  React.useEffect(() => {
    const updateMaxWidth = () => {
      const newMaxWidth = Math.floor(window.innerWidth * 0.7);
      setPanelWidth(prevWidth => {
        // If current width is more than 70% of viewport, cap it
        if (prevWidth && prevWidth > newMaxWidth) {
          if (onPanelWidthChange) {
            onPanelWidthChange(newMaxWidth);
          }
          return newMaxWidth;
        }
        return prevWidth;
      });
    };

    // Only add resize listener, don't run initial setup to avoid resetting user width
    window.addEventListener('resize', updateMaxWidth);
    return () => window.removeEventListener('resize', updateMaxWidth);
  }, [onPanelWidthChange]);

  // Calculate if we should show resizable panel
  const shouldShowResizable = React.useMemo(() => {
    if (isSmallScreen) return false; // Disable resize for screens below 768px
    if (isMediumScreen) return false;
    if (isCustomBreakpoint && isLeftSidebarExpanded) return false;
    return true;
  }, [isSmallScreen, isMediumScreen, isCustomBreakpoint, isLeftSidebarExpanded]);

  // Handle resizing
  // Refs for smooth resizing performance
  const animationFrameRef = React.useRef<number>();
  const currentWidthRef = React.useRef<number>(defaultWidth);
  const lastUpdateTimeRef = React.useRef<number>(0);

  // Keep currentWidthRef in sync with panelWidth changes from other sources
  React.useEffect(() => {
    if (panelWidth && !isResizing) {
      currentWidthRef.current = panelWidth;
    }
  }, [panelWidth, isResizing]);

  // Initialize currentWidthRef when panelWidth is first set
  React.useEffect(() => {
    if (panelWidth && currentWidthRef.current === defaultWidth) {
      currentWidthRef.current = panelWidth;
    }
  }, [panelWidth, defaultWidth]);

  // Optimized mouse move handler with RAF throttling
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth 60fps updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const now = performance.now();

      // Throttle to ~60fps (16.67ms between updates)
      if (now - lastUpdateTimeRef.current < 16) return;
      lastUpdateTimeRef.current = now;

      const screenWidth = window.innerWidth;

      // Calculate new width from the right edge
      let newWidth = screenWidth - e.clientX;

      // Calculate dynamic max width based on screen size (cached for performance)
      let maxAllowedWidth: number;
      if (screenWidth >= 1920) {
        maxAllowedWidth = screenWidth * 0.7;
      } else if (screenWidth >= 1500) {
        maxAllowedWidth = screenWidth * 0.68;
      } else if (screenWidth >= 1366) {
        maxAllowedWidth = screenWidth * 0.6;
      } else if (screenWidth >= 1280) {
        maxAllowedWidth = screenWidth * 0.58;
      } else if (screenWidth >= 1109) {
        maxAllowedWidth = screenWidth * 0.52;
      } else {
        maxAllowedWidth = screenWidth * 0.47;
      }

      // Ensure minimum width for content visibility
      const minContentWidth = 400;
      const calculatedMaxWidth = Math.min(
        maxAllowedWidth,
        screenWidth - minContentWidth - (isLeftSidebarExpanded ? 256 : 72) - 32
      );

      // Apply bounds
      const boundedWidth = Math.max(
        minWidth,
        Math.min(newWidth, calculatedMaxWidth)
      );

      // Only update if width actually changed (avoid unnecessary re-renders)
      if (Math.abs(currentWidthRef.current - boundedWidth) > 1) {
        currentWidthRef.current = boundedWidth;

        // Use CSS custom property for immediate visual feedback
        if (panelRef.current) {
          panelRef.current.style.setProperty('--panel-width', `${boundedWidth}px`);
        }

        // Batch state update
        setPanelWidth(boundedWidth);

        // Real-time parent callback during dragging for immediate layout updates
        if (onPanelWidthChange) {
          onPanelWidthChange(boundedWidth);
        }
      }
    });
  }, [isResizing, minWidth, isLeftSidebarExpanded]);



  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  const handleMouseUp = React.useCallback(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Clear CSS custom property to let React state take over
    if (panelRef.current) {
      panelRef.current.style.removeProperty('--panel-width');
    }

    // Final callback to parent with the current width (debounced)
    if (onPanelWidthChange && currentWidthRef.current) {
      onPanelWidthChange(currentWidthRef.current);
    }
  }, [onPanelWidthChange]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    // Set initial CSS custom property to current width to prevent jump
    if (panelRef.current && currentWidthRef.current) {
      panelRef.current.style.setProperty('--panel-width', `${currentWidthRef.current}px`);
    }
  }, []);

  // Add/remove event listeners for resizing with passive option for better performance
  React.useEffect(() => {
    if (isResizing) {
      // Use passive listeners for better performance
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // Cleanup animation frame on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle screen size changes and update panel width accordingly
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePanelWidth = () => {
      // Update fullscreen state
      const isMobileView = window.matchMedia('(max-width: 1023px)').matches;
      const isLargeScreen = window.innerWidth >= 1024;
      const isSmallScreenView = window.innerWidth < 768;
      
      setIsFullScreen(isMobileView);
      setIsSmallScreen(isSmallScreenView);

      if (isMobileView) {
        setPanelWidth(null);
      }

      // For screens 1024px and above, close sidebar when panel is opened
      if (isLargeScreen && isOpen && !isMobileView) {
        const event = new CustomEvent('sidebar:close');
        window.dispatchEvent(event);
      }
    };

    const updatePanelWidthOnResize = () => {
      const screenWidth = window.innerWidth;

      // Only auto-adjust if not currently resizing and only on significant screen size changes
      if (!isResizing) {
        const newWidth = getInitialPanelWidth();
        setPanelWidth(prevWidth => {
          // Only update if the change is significant (more than 50px difference) to avoid unnecessary resets
          return Math.abs((prevWidth || 0) - newWidth) > 50 ? newWidth : prevWidth;
        });
      }

      // Update other states
      updatePanelWidth();
    };

    // Initial setup - only update states, don't reset width
    updatePanelWidth();

    // Handle sidebar close events
    const handleSidebarClose = () => {
      const width = window.innerWidth;
      if (width >= 1024 && isOpen) {
        // If sidebar is closed and panel is open on large screens, keep the panel open
        setPanelWidth(prevWidth => prevWidth || defaultWidth);
      }
    };

    // Add event listeners
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    mediaQuery.addEventListener('change', updatePanelWidth);
    window.addEventListener('resize', updatePanelWidthOnResize);
    window.addEventListener('sidebar:close', handleSidebarClose);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updatePanelWidth);
      window.removeEventListener('resize', updatePanelWidthOnResize);
      window.removeEventListener('sidebar:close', handleSidebarClose);
    };
  }, []);

  // Compute responsive width class and styles
  const { widthClass, panelStyle } = React.useMemo(() => {
    // Full screen mode takes highest priority
    if (isFullScreen) {
      return {
        widthClass: 'w-[calc(100vw-16px)]',
        panelStyle: {}
      };
    }

    // Medium screens (mobile/tablet) - take full width with small margins
    if (isMediumScreen) {
      return {
        widthClass: 'w-[calc(100vw-16px)] mx-2',
        panelStyle: {}
      };
    }

    // Custom breakpoint (1024px - 1227px)
    if (isCustomBreakpoint) {
      if (isLeftSidebarExpanded) {
        // When sidebar is expanded at custom breakpoint
        return {
          widthClass: 'w-[calc(100%-18rem-16px)] ml-auto mr-2',
          panelStyle: {
            minWidth: `${minWidth}px`,
            maxWidth: '60vw',
            width: panelWidth || undefined
          }
        };
      } else {
        // When sidebar is collapsed at custom breakpoint
        return {
          widthClass: 'w-[calc(100%-4rem-16px)] ml-auto mr-2',
          panelStyle: {
            minWidth: `${minWidth}px`,
            maxWidth: '70vw',
            width: panelWidth || undefined
          }
        };
      }
    }

    // Default desktop behavior (≥1228px)
    if (isLeftSidebarExpanded) {
      return {
        widthClass: 'w-[50vw]',
        panelStyle: {
          minWidth: `${minWidth}px`,
          maxWidth: `${maxWidth}px`,
          width: panelWidth || undefined
        }
      };
    } else {
      return {
        widthClass: 'w-[50vw]',
        panelStyle: {
          minWidth: `${minWidth}px`,
          maxWidth: `${maxWidth}px`,
          width: panelWidth || undefined
        }
      };
    }
  }, [isFullScreen, isLeftSidebarExpanded, isMediumScreen, isCustomBreakpoint, panelWidth, minWidth, maxWidth]);

  React.useEffect(() => {
    const newSnapshots = toolCalls.map((toolCall, index) => ({
      id: `${index}-${toolCall.assistantCall.timestamp || Date.now()}`,
      toolCall,
      index,
      timestamp: Date.now(),
    }));

    const hadSnapshots = toolCallSnapshots.length > 0;
    const hasNewSnapshots = newSnapshots.length > toolCallSnapshots.length;
    setToolCallSnapshots(newSnapshots);

    if (!isInitialized && newSnapshots.length > 0) {
      const completedCount = newSnapshots.filter(s =>
        s.toolCall.toolResult?.content &&
        s.toolCall.toolResult.content !== 'STREAMING'
      ).length;

      if (completedCount > 0) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        setInternalIndex(Math.max(0, lastCompletedIndex));
      } else {
        setInternalIndex(Math.max(0, newSnapshots.length - 1));
      }
      setIsInitialized(true);
    } else if (hasNewSnapshots && navigationMode === 'live') {
      const latestSnapshot = newSnapshots[newSnapshots.length - 1];
      const isLatestStreaming = latestSnapshot?.toolCall.toolResult?.content === 'STREAMING';
      if (isLatestStreaming) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        if (lastCompletedIndex >= 0) {
          setInternalIndex(lastCompletedIndex);
        } else {
          setInternalIndex(newSnapshots.length - 1);
        }
      } else {
        setInternalIndex(newSnapshots.length - 1);
      }
    } else if (hasNewSnapshots && navigationMode === 'manual') {
    }
  }, [toolCalls, navigationMode, toolCallSnapshots.length, isInitialized]);

  React.useEffect(() => {
    if (isOpen && !isInitialized && toolCallSnapshots.length > 0) {
      setInternalIndex(Math.min(currentIndex, toolCallSnapshots.length - 1));
    }
  }, [isOpen, currentIndex, isInitialized, toolCallSnapshots.length]);

  const safeInternalIndex = Math.min(internalIndex, Math.max(0, toolCallSnapshots.length - 1));
  const currentSnapshot = toolCallSnapshots[safeInternalIndex];
  const currentToolCall = currentSnapshot?.toolCall;
  const totalCalls = toolCallSnapshots.length;

  const completedToolCalls = toolCallSnapshots.filter(snapshot =>
    snapshot.toolCall.toolResult?.content &&
    snapshot.toolCall.toolResult.content !== 'STREAMING'
  );
  const totalCompletedCalls = completedToolCalls.length;

  let displayToolCall = currentToolCall;
  let displayIndex = safeInternalIndex;
  let displayTotalCalls = totalCalls;

  const isCurrentToolStreaming = currentToolCall?.toolResult?.content === 'STREAMING';
  if (isCurrentToolStreaming && totalCompletedCalls > 0) {
    const lastCompletedSnapshot = completedToolCalls[completedToolCalls.length - 1];
    displayToolCall = lastCompletedSnapshot.toolCall;
    displayIndex = totalCompletedCalls - 1;
    displayTotalCalls = totalCompletedCalls;
  } else if (!isCurrentToolStreaming) {
    const completedIndex = completedToolCalls.findIndex(snapshot => snapshot.id === currentSnapshot?.id);
    if (completedIndex >= 0) {
      displayIndex = completedIndex;
      displayTotalCalls = totalCompletedCalls;
    }
  }

  const currentToolName = displayToolCall?.assistantCall?.name || 'Tool Call';
  const CurrentToolIcon = getToolIcon(
    currentToolCall?.assistantCall?.name || 'unknown',
  );
  const isStreaming = displayToolCall?.toolResult?.content === 'STREAMING';

  // Extract actual success value from tool content with fallbacks
  const getActualSuccess = (toolCall: any): boolean => {
    const content = toolCall?.toolResult?.content;
    if (!content) return toolCall?.toolResult?.isSuccess ?? true;

    const safeParse = (data: any) => {
      try { return typeof data === 'string' ? JSON.parse(data) : data; }
      catch { return null; }
    };

    const parsed = safeParse(content);
    if (!parsed) return toolCall?.toolResult?.isSuccess ?? true;

    if (parsed.content) {
      const inner = safeParse(parsed.content);
      if (inner?.tool_execution?.result?.success !== undefined) {
        return inner.tool_execution.result.success;
      }
    }
    const success = parsed.tool_execution?.result?.success ??
      parsed.result?.success ??
      parsed.success;

    return success !== undefined ? success : (toolCall?.toolResult?.isSuccess ?? true);
  };

  const isSuccess = isStreaming ? true : getActualSuccess(displayToolCall);

  const isFirstFileOperation = React.useMemo(() => {
    if (!currentToolCall) return false;

    const currentFilePath = extractFilePathFromToolCall(currentToolCall);
    if (!currentFilePath) return false;

    for (let i = 0; i < safeInternalIndex; i++) {
      const previousToolCall = toolCallSnapshots[i]?.toolCall;
      if (previousToolCall) {
        const previousFilePath = extractFilePathFromToolCall(previousToolCall);
        if (previousFilePath === currentFilePath) {
          return false; // Found a previous operation on the same file
        }
      }
    }

    return true; // This is the first operation on this file
  }, [safeInternalIndex, toolCallSnapshots, currentToolCall]);

  const internalNavigate = React.useCallback((newIndex: number, source: string = 'internal') => {
    if (newIndex < 0 || newIndex >= totalCalls) return;

    const isNavigatingToLatest = newIndex === totalCalls - 1;

    // console.log(`[INTERNAL_NAV] ${source}: ${internalIndex} -> ${newIndex}, mode will be: ${isNavigatingToLatest ? 'live' : 'manual'}`);

    setInternalIndex(newIndex);

    if (isNavigatingToLatest) {
      setNavigationMode('live');
    } else {
      setNavigationMode('manual');
    }

    if (source === 'user_explicit') {
      onNavigate(newIndex);
    }
  }, [internalIndex, totalCalls, onNavigate]);

  // Helper function to format elapsed time
  const formatElapsedTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const isLiveMode = navigationMode === 'live';
  const showJumpToLive = navigationMode === 'manual' && agentStatus === 'running';
  const showJumpToLatest = navigationMode === 'manual' && agentStatus !== 'running';

  const navigateToPrevious = React.useCallback(() => {
    if (displayIndex > 0) {
      const targetCompletedIndex = displayIndex - 1;
      const targetSnapshot = completedToolCalls[targetCompletedIndex];
      if (targetSnapshot) {
        const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
        if (actualIndex >= 0) {
          setNavigationMode('manual');
          internalNavigate(actualIndex, 'user_explicit');
        }
      }
    }
  }, [displayIndex, completedToolCalls, toolCallSnapshots, internalNavigate]);

  const navigateToNext = React.useCallback(() => {
    if (displayIndex < displayTotalCalls - 1) {
      const targetCompletedIndex = displayIndex + 1;
      const targetSnapshot = completedToolCalls[targetCompletedIndex];
      if (targetSnapshot) {
        const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
        if (actualIndex >= 0) {
          const isLatestCompleted = targetCompletedIndex === completedToolCalls.length - 1;
          if (isLatestCompleted) {
            setNavigationMode('live');
          } else {
            setNavigationMode('manual');
          }
          internalNavigate(actualIndex, 'user_explicit');
        }
      }
    }
  }, [displayIndex, displayTotalCalls, completedToolCalls, toolCallSnapshots, internalNavigate]);

  const jumpToLive = React.useCallback(() => {
    setNavigationMode('live');
    internalNavigate(totalCalls - 1, 'user_explicit');
  }, [totalCalls, internalNavigate]);

  const jumpToLatest = React.useCallback(() => {
    setNavigationMode('manual');
    internalNavigate(totalCalls - 1, 'user_explicit');
  }, [totalCalls, internalNavigate]);

  const resetTimer = React.useCallback(() => {
    setAccumulatedTime(0);
    setFinalRuntime(null);
    setAgentStartTime(null);
    setElapsedTime(0);
    setDatabaseRuntime(0);
    setGeneratedAgentRunId(null);
  }, []);

  const fetchDatabaseRuntime = React.useCallback(async () => {
    if (!threadId) return;

    // TODO: Implement runtime tracking API endpoint
    // For now, this is a no-op to prevent 404 errors
    // console.log('Runtime tracking: Fetching database runtime (not yet implemented)', { threadId });
    setDatabaseRuntime(0); // Set to 0 since we can't fetch from non-existent endpoint
  }, [threadId]);

  const createAgentRun = React.useCallback(async (runId: string, threadId: string) => {
    // TODO: Implement runtime tracking API endpoint
    // For now, this is a no-op to prevent 404 errors
    // console.log('Runtime tracking: Agent run created (not yet implemented)', { runId, threadId });
  }, []);

  const completeAgentRun = React.useCallback(async (runId: string, totalRuntime: number) => {
    // TODO: Implement runtime tracking API endpoint
    // For now, this is a no-op to prevent 404 errors
    // console.log('Runtime tracking: Agent run completed (not yet implemented)', { runId, totalRuntime });

    // Refresh runtime from database after completion if needed
    if (threadId) {
      fetchDatabaseRuntime();
    }
  }, [threadId, fetchDatabaseRuntime]);

  const updateHeartbeat = React.useCallback(async (runId: string) => {
    // TODO: Implement runtime tracking API endpoint
    // For now, this is a no-op to prevent 404 errors
    // console.log('Runtime tracking: Heartbeat update (not yet implemented)', { runId });
  }, []);

  const renderStatusButton = React.useCallback(() => {
    const baseClasses = "flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full w-[116px]";
    const dotClasses = "w-1.5 h-1.5 rounded-full";
    const textClasses = "text-xs font-medium";

    if (isLiveMode) {
      if (agentStatus === 'running') {
        return (
          <div className={`${baseClasses} bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800`}>
            <div className={`${dotClasses} bg-helium-teal animate-pulse`} />
            <span className={`${textClasses} text-helium-teal`}>Live Updates</span>
          </div>
        );
      } else {
        return (
          <div className={`${baseClasses} bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800`}>
            <div className={`${dotClasses} bg-neutral-500`} />
            <span className={`${textClasses} text-neutral-700 dark:text-neutral-400`}>Latest Tool</span>
          </div>
        );
      }
    } else {
      if (agentStatus === 'running') {
        return (
          <div
            className={`${baseClasses} bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer`}
            onClick={jumpToLive}
          >
            <div className={`${dotClasses} bg-helium-teal animate-pulse`} />
            <span className={`${textClasses} text-helium-teal`}>Jump to Live</span>
          </div>
        );
      } else {
        return (
          <div
            className={`${baseClasses} bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer`}
            onClick={jumpToLatest}
          >
            <div className={`${dotClasses} bg-green-500`} />
            <span className={`${textClasses} text-green-600`}>Jump to Latest</span>
          </div>
        );
      }
    }
  }, [isLiveMode, agentStatus, jumpToLive, jumpToLatest]);

  const handleSliderChange = React.useCallback(([newValue]: [number]) => {
    const targetSnapshot = completedToolCalls[newValue];
    if (targetSnapshot) {
      const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
      if (actualIndex >= 0) {
        const isLatestCompleted = newValue === completedToolCalls.length - 1;
        if (isLatestCompleted) {
          setNavigationMode('live');
        } else {
          setNavigationMode('manual');
        }

        internalNavigate(actualIndex, 'user_explicit');
      }
    }
  }, [completedToolCalls, toolCallSnapshots, internalNavigate]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    // Previously, expanding the left sidebar closed the panel.
    // We now keep the panel open and smoothly adjust its width instead.
    // Listener intentionally removed to avoid abrupt close.
  }, [isOpen, handleClose]);

  React.useEffect(() => {
    if (externalNavigateToIndex !== undefined && externalNavigateToIndex >= 0 && externalNavigateToIndex < totalCalls) {
      internalNavigate(externalNavigateToIndex, 'external_click');
    }
  }, [externalNavigateToIndex, totalCalls, internalNavigate]);

  // Reset accumulated time when starting a new thread
  React.useEffect(() => {
    if (resetAccumulatedTime) {
      setAccumulatedTime(0);
      setFinalRuntime(null);
      setAgentStartTime(null);
      setElapsedTime(0);
      setDatabaseRuntime(0);
    }
  }, [resetAccumulatedTime]);

  // Handle panel open/close
  React.useEffect(() => {
    if (isOpen) {
      // Panel is opening
      setHasOpened(true);
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }

    // Cleanup on unmount
    return () => {
      setIsExpanded(false);
    };
  }, [isOpen, setIsExpanded]);

  // Fetch runtime from database when threadId changes or component mounts
  React.useEffect(() => {
    if (threadId) {
      fetchDatabaseRuntime();
    }
  }, [threadId, fetchDatabaseRuntime]);

  // Timer effect for agent runtime
  React.useEffect(() => {
    if (agentStatus === 'running' && !agentStartTime) {
      // Agent just started running - this is now handled by the other effects
      return;
    } else if (agentStatus !== 'running' && agentStartTime) {
      // Agent stopped running - accumulate the runtime
      const totalRuntime = Date.now() - agentStartTime;
      setAccumulatedTime(prev => prev + totalRuntime);
      // Show total accumulated time including database runtime
      setFinalRuntime(databaseRuntime + accumulatedTime + totalRuntime);
      setAgentStartTime(null);
      setElapsedTime(0);

      // Complete agent run in database - use generated agentRunId if prop one is not available
      const runIdToUse = agentRunId || generatedAgentRunId;
      if (runIdToUse) {
        // console.log('Completing agent run:', { runIdToUse, totalRuntime });
        completeAgentRun(runIdToUse, totalRuntime);
      } else {
        // console.log('Missing agentRunId for completion');
      }
    }
  }, [agentStatus, agentStartTime, accumulatedTime, databaseRuntime, threadId, agentRunId, generatedAgentRunId, createAgentRun, completeAgentRun]);

  // Effect to handle agentRunId changes (when agent starts)
  React.useEffect(() => {
    if (agentRunId && agentStatus === 'running' && !agentStartTime) {
      // We have an agentRunId and agent is running, but we haven't started tracking yet
      // console.log('AgentRunId available, starting runtime tracking:', { agentRunId, threadId });
      setAgentStartTime(Date.now());
      setElapsedTime(0);
      setFinalRuntime(null);

      // Create the agent run record
      if (threadId) {
        createAgentRun(agentRunId, threadId);
      }
    }
  }, [agentRunId, agentStatus, agentStartTime, threadId, createAgentRun]);

  // Generate agentRunId if not provided when agent starts running
  React.useEffect(() => {
    if (agentStatus === 'running' && !agentRunId && !agentStartTime) {
      // Generate a new agentRunId if we don't have one
      const newAgentRunId = crypto.randomUUID();

      setGeneratedAgentRunId(newAgentRunId);

      // Create the agent run record immediately
      if (threadId) {
        createAgentRun(newAgentRunId, threadId);
        setAgentStartTime(Date.now());
        setElapsedTime(0);
        setFinalRuntime(null);
      }
    }
  }, [agentStatus, agentRunId, agentStartTime, threadId, createAgentRun]);

  // Timer effect for updating elapsed time - DISABLED to reduce load
  // React.useEffect(() => {
  //   if (!agentStartTime || agentStatus !== 'running') return;

  //   const interval = setInterval(() => {
  //     setElapsedTime(Date.now() - agentStartTime);

  //     // Update heartbeat in database every 5 seconds
  //     const runIdToUse = agentRunId || generatedAgentRunId;
  //     if (runIdToUse && Date.now() % 5000 < 1000) {
  //       updateHeartbeat(runIdToUse);
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [agentStartTime, agentStatus, agentRunId, generatedAgentRunId, updateHeartbeat]);

  React.useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 h-full bg-background border-l border-border transition-all duration-300 ease-in-out overflow-hidden thread-content-container",
          isFullScreen ? "w-full" : "w-[var(--panel-width)]",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        )}
        style={{
          ...panelStyle,
          ...(panelWidth ? { '--panel-width': `${panelWidth}px` } : {}),
          zIndex: 20, // Lower than the sidebar and its overlay
        }}
      >
        <div className="p-4 h-full flex items-stretch justify-end pointer-events-auto">
          <div
            className={cn(
              'border rounded-xl flex flex-col bg-white transition-[width] duration-200 ease-in-out will-change-[width]',
              isMobile ? 'w-full' : widthClass,
            )}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="pt-4 pl-4 pr-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="ml-2 flex items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-accent-foreground/80 prose prose-sm dark:prose-invert">
                        {/* {agentName ? `${agentName}'s Computer` : 'Suna\'s Computer'} */}
                        Helium Core
                      </h2>
                      {agentStatus === 'running' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span>Running</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="h-8 w-8"
                      title="Minimize to floating preview"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-20 w-full rounded-md" />
                    <Skeleton className="h-40 w-full rounded-md" />
                    <Skeleton className="h-20 w-full rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!displayToolCall && toolCallSnapshots.length === 0) {
      return (
        <div className="flex flex-col h-full">
          <div className="pt-4 pl-4 pr-4">
            <div className="flex items-center justify-between">
              <div className="ml-2 flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-accent-foreground/80 prose prose-sm dark:prose-invert">
                  {/* {agentName ? `${agentName}'s Computer` : 'Suna\'s Computer'} */}
                  Helium Core
                </h2>

              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative w-[20%] h-[20%] flex items-center justify-center">
                <Image
                  src="/helium-brain.png"
                  alt="Helium Core Initiating"
                  width={240}
                  height={240}
                  className="w-full h-full object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/helium-brain(dark).png"
                  alt="Helium Core Initiating"
                  width={240}
                  height={240}
                  className="w-full h-full object-contain hidden dark:block"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!displayToolCall && toolCallSnapshots.length > 0) {
      const firstStreamingTool = toolCallSnapshots.find(s => s.toolCall.toolResult?.content === 'STREAMING');
      if (firstStreamingTool && totalCompletedCalls === 0) {
        return (
          <div className="flex flex-col h-full">
            <div className="pt-4 pl-4 pr-4">
              <div className="flex items-center justify-between">
                <div className="ml-2 flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-accent-foreground/80 prose prose-sm dark:prose-invert">
                    {/* {agentName ? `${agentName}'s Computer` : 'Suna\'s Computer'} */}
                    Helium Core
                  </h2>

                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1.5">
                    <CircleDashed className="h-3 w-3 animate-spin" />
                    <span>Running</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 ml-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 p-8">
              <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <CircleDashed className="h-8 w-8 text-blue-500 dark:text-blue-400 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    Tool is running
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {getUserFriendlyToolName(firstStreamingTool.toolCall.assistantCall.name || 'Tool')} is currently executing. Results will appear here when complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full">
          <div className="pt-4 pl-4 pr-4">
            <div className="flex items-center justify-between">
              <div className="ml-2 flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-accent-foreground/80 prose prose-sm dark:prose-invert">
                  {/* {agentName ? `${agentName}'s Computer` : 'Suna\'s Computer'} */}
                  Helium Core
                </h2>

              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        </div>
      );
    }

    const toolView = (
      <ToolView
        name={displayToolCall.assistantCall.name}
        assistantContent={displayToolCall.assistantCall.content}
        toolContent={displayToolCall.toolResult?.content}
        assistantTimestamp={displayToolCall.assistantCall.timestamp}
        toolTimestamp={displayToolCall.toolResult?.timestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
        project={project}
        messages={messages}
        agentStatus={agentStatus}
        currentIndex={displayIndex}
        totalCalls={displayTotalCalls}
        onFileClick={onFileClick}
        isFirstFileOperation={isFirstFileOperation}
      />
    );

    return (
      <div className="flex flex-col h-full">
        <motion.div
          layoutId={CONTENT_LAYOUT_ID}
          className="p-3"
        >
          <div className="flex items-center justify-between">
            <motion.div layoutId="tool-icon" className="ml-2 flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-accent-foreground/80 prose prose-sm dark:prose-invert">
                {/* {agentName ? `${agentName}'s Computer` : 'Helium\'s Brain'} */}
                Helium Core
              </h2>

            </motion.div>

            {displayToolCall.toolResult?.content && !isStreaming && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 ml-1"
                  title="Minimize to floating preview"
                >
                  <Image src="/icons/minimize2-light.svg" alt="expand" width={18} height={18} className="block dark:hidden mb-0" />
                  <Image src="/icons/minimize2-dark.svg" alt="expand" width={18} height={18} className="hidden dark:block mb-0" />
                </Button>
              </div>
            )}

            {isStreaming && (
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1.5">
                  <CircleDashed className="h-3 w-3 animate-spin" />
                  <span>Running</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 ml-1"
                  title="Minimize to floating preview"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!displayToolCall.toolResult?.content && !isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
                title="Minimize to floating preview"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        <div className="flex-1 p-4 pt-0 overflow-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent tool-call-content">
          {toolView}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="sidepanel"
          ref={panelRef}
          layoutId={FLOATING_LAYOUT_ID}
          initial={disableInitialAnimation ? { opacity: 1 } : { opacity: 0 }}
          animate={{
            opacity: 1,
            ...(shouldShowResizable && panelWidth && { width: panelWidth })
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: disableInitialAnimation ? 0 : 0.15 },
            width: { duration: 0.2 },
            layout: {
              type: "spring",
              stiffness: 400,
              damping: 35
            }
          }}
          className={cn(
            'fixed top-1 bottom-1 md:top-3 right-2 md:bottom-6 shadow-md shadow-foreground/5 dark:shadow-sidebar-accent/30 border rounded-[22px] flex flex-col z-[51] md:z-30 transition-[width] duration-200 ease-in-out will-change-[width]',
            widthClass,
            'bg-background',
            isResizing && 'select-none',
            shouldShowResizable && 'resize-handle-container',
            {
              'left-auto': !isMediumScreen,
              'right-2': true,
              'md:right-4': !isMediumScreen && !isCustomBreakpoint
            }
          )}
          style={{
            overflow: 'hidden',
            ...panelStyle,
            // Use CSS custom property for immediate visual feedback during resize
            width: isResizing ? 'var(--panel-width, auto)' : panelStyle.width,
            // Enable hardware acceleration for smooth resizing
            willChange: isResizing ? 'width' : 'auto',
            // Ensure smooth transitions when not resizing
            transition: isResizing ? 'none' : 'width 0.2s ease-out'
          }}
        >
          {shouldShowResizable && (

            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 cursor-ew-resize z-50 hover:bg-green-500/20 active:bg-green-500/40 transition-colors"
              onMouseDown={handleMouseDown}
            >
              
              <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-green-500/50 rounded-full" />
            </div>
          )}

          <div
            className="flex-1 flex flex-col overflow-hidden bg-card"
            style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
          >
            {renderContent()}
          </div>
          {(displayTotalCalls > 1 || (isCurrentToolStreaming && totalCompletedCalls > 0)) && (
            <div
              className={cn(
                'border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900',
                isMobile ? 'p-2' : 'px-4 py-2.5',
              )}
            >
              {isMobile ? (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToPrevious}
                    disabled={displayIndex <= 0}
                    className="h-8 px-2.5 text-xs"
                  >
                    <SkipBack className="h-3.5 w-3.5 mr-1" />
                    <span>Prev</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium tabular-nums min-w-[44px]">
                      {displayIndex + 1}/{displayTotalCalls}
                    </span>
                    {renderStatusButton()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToNext}
                    disabled={displayIndex >= displayTotalCalls - 1}
                    className="h-8 px-2.5 text-xs"
                  >
                    <span>Next</span>
                    <SkipForward className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={navigateToPrevious}
                      disabled={displayIndex <= 0}
                      className="h-7 w-7 text-zinc-500 cursor-pointer hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <Image src="/icons/skip-back.svg" alt="expand" width={18} height={18} className="block dark:hidden mb-0" />
                      <Image src="/icons/skip-back-dark.svg" alt="expand" width={18} height={18} className="hidden dark:block mb-0" />
                    </Button>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium tabular-nums px-1 min-w-[44px] text-center">
                      {displayIndex + 1}/{displayTotalCalls}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={navigateToNext}
                      disabled={displayIndex >= displayTotalCalls - 1}
                      className="h-7 w-7 text-zinc-500 cursor-pointer hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <Image src="/icons/skip-forward.svg" alt="expand" width={18} height={18} className="block dark:hidden mb-0" />
                      <Image src="/icons/skip-forward-dark.svg" alt="expand" width={18} height={18} className="hidden dark:block mb-0" />
                    </Button>
                  </div>

                  <div className="flex-1 relative">
                    <Slider
                      min={0}
                      max={displayTotalCalls - 1}
                      step={1}
                      value={[displayIndex]}
                      onValueChange={handleSliderChange}
                      className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-zinc-200 dark:[&>span:first-child]:bg-zinc-800 [&>span:first-child>span]:bg-helium-blue [&>span:first-child>span]:h-1.5"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {renderStatusButton()}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}