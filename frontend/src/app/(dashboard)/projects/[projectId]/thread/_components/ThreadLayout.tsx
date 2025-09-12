import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/thread/thread-site-header';
import { FileViewerModal } from '@/components/thread/file-viewer-modal';
import { ToolCallSidePanel } from '@/components/thread/tool-call-side-panel';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { Project } from '@/lib/api';
import { ApiMessageType, BillingData } from '../_types';
import { ToolCallInput } from '@/components/thread/tool-call-side-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { logManualEvent } from '@/lib/api';
import { useMediumScreen } from '@/hooks/react-query/use-medium-screen';
import { useCustomBreakpoint } from '@/hooks/use-custom-breakpoints';

interface ThreadLayoutProps {
  children: React.ReactNode;
  threadId: string;
  projectName: string;
  projectId: string;
  project: Project | null;
  sandboxId: string | null;
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: (open: boolean) => void;
  onToggleSidePanel: () => void;
  onProjectRenamed?: (newName: string) => void;
  onViewFiles: (filePath?: string, filePathList?: string[]) => void;
  fileViewerOpen: boolean;
  setFileViewerOpen: (open: boolean) => void;
  fileToView: string | null;
  filePathList?: string[];
  toolCalls: ToolCallInput[];
  messages: ApiMessageType[];
  externalNavIndex?: number;
  agentStatus: 'idle' | 'running' | 'connecting' | 'paused' | 'error';
  paused: boolean;
  inTakeover: boolean;
  onHeaderTakeoverToggle: () => void;
  onLogManual?: (payload: { event_type: string; data?: Record<string, any>; description?: string }) => Promise<void>;
  currentToolIndex: number;
  onSidePanelNavigate: (index: number) => void;
  onSidePanelClose: () => void;
  renderAssistantMessage: (
    assistantContent?: string,
    toolContent?: string,
  ) => React.ReactNode;
  renderToolResult: (
    toolContent?: string,
    isSuccess?: boolean,
  ) => React.ReactNode;
  isLoading: boolean;
  showBillingAlert: boolean;
  billingData: BillingData;
  onDismissBilling: () => void;
  debugMode: boolean;
  isMobile: boolean;
  initialLoadCompleted: boolean;
  agentName?: string;
  disableInitialAnimation?: boolean;
  agentRunId?: string;
  onPanelWidthChange?: (width: number) => void;
  initialPanelWidth?: number;
}

export function ThreadLayout({
  children,
  threadId,
  projectName,
  projectId,
  project,
  sandboxId,
  isSidePanelOpen,
  setIsSidePanelOpen,
  onToggleSidePanel,
  onProjectRenamed,
  onViewFiles,
  fileViewerOpen,
  setFileViewerOpen,
  fileToView,
  filePathList,
  toolCalls,
  messages,
  externalNavIndex,
  agentStatus,
  paused,
  inTakeover,
  onHeaderTakeoverToggle,
  onLogManual,
  currentToolIndex,
  onSidePanelNavigate,
  onSidePanelClose,
  renderAssistantMessage,
  renderToolResult,
  isLoading,
  showBillingAlert,
  billingData,
  onDismissBilling,
  debugMode,
  isMobile,
  initialLoadCompleted,
  agentName,
  disableInitialAnimation = false,
  agentRunId,
  onPanelWidthChange,
  initialPanelWidth,
}: ThreadLayoutProps) {
  const { state: leftSidebarState } = useSidebar();
  const isLeftSidebarExpanded = leftSidebarState === 'expanded';
  const isMediumScreen = useMediumScreen();
  const isCustomBreakpoint = useCustomBreakpoint();
  const [panelWidth, setPanelWidth] = React.useState<number | null>(initialPanelWidth || null);
  const isResizing = React.useRef(false);
  const initialLoadCompletedRef = React.useRef(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const resizeHandleRef = React.useRef<HTMLDivElement>(null);
  const startWidth = React.useRef<number>(0);
  const width = panelWidth || Math.floor(window.innerWidth * 0.5);
  // Call the onPanelWidthChange callback when panelWidth changes
  React.useEffect(() => {
    if (onPanelWidthChange && panelWidth) {
      onPanelWidthChange(panelWidth);
    }
  }, [panelWidth, onPanelWidthChange]);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    
    const newWidth = Math.max(320, Math.min(window.innerWidth - e.clientX - 16, 800));
    setPanelWidth(newWidth);
  }, []);

  const handleMouseUp = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    startWidth.current = panelWidth || 400;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [isLeftSidebarExpanded, panelWidth]);

  // Add/remove event listeners for resizing
  React.useEffect(() => {
    if (isResizing.current) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Calculate the right margin for the left section based on panel width
  const getRightMargin = React.useCallback(() => {
    if (!isSidePanelOpen || !initialLoadCompleted) return '0px';
    if (isMediumScreen) return '0px';
    if (isCustomBreakpoint && isLeftSidebarExpanded) return '0px';
    
    const width = panelWidth || Math.floor(window.innerWidth / 2); // Default width if not set
    return `${width}px`;
  }, [isSidePanelOpen, initialLoadCompleted, isMediumScreen, isCustomBreakpoint, isLeftSidebarExpanded, panelWidth]);

  const rightMargin = getRightMargin();
  return (
    <div className="flex h-screen">
      {debugMode && (
        <div className="fixed top-16 right-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-md shadow-md z-50">
          Debug Mode
        </div>
      )}

      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-200 ease-in-out will-change-[margin] relative"
        style={{
          marginRight: rightMargin,
          minWidth: isSidePanelOpen && !isMediumScreen && (!isCustomBreakpoint || !isLeftSidebarExpanded) 
            ? `calc(100% - ${rightMargin})` 
            : '100%',
          maxWidth: isSidePanelOpen && !isMediumScreen && (!isCustomBreakpoint || !isLeftSidebarExpanded) 
            ? `calc(100% - ${rightMargin})` 
            : '100%',
        }}
      >
        <SiteHeader
          threadId={threadId}
          projectName={projectName}
          projectId={projectId}
          createdAt={project?.created_at}
          onViewFiles={onViewFiles}
          onToggleSidePanel={onToggleSidePanel}
          onProjectRenamed={onProjectRenamed}
          isMobileView={isMobile}
          debugMode={debugMode}
          paused={paused}
          inTakeover={inTakeover}
          onTakeoverToggle={onHeaderTakeoverToggle}
          isSidePanelOpen={isSidePanelOpen}
          agentStatus={agentStatus}
        />

        {children}
      </div>

      <ToolCallSidePanel
        isOpen={isSidePanelOpen && initialLoadCompleted}
        onClose={onSidePanelClose}
        toolCalls={toolCalls}
        messages={messages}
        externalNavigateToIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentIndex={currentToolIndex}
        onNavigate={onSidePanelNavigate}
        project={project || undefined}
        renderAssistantMessage={renderAssistantMessage}
        renderToolResult={renderToolResult}
        isLoading={!initialLoadCompleted || isLoading}
        onFileClick={onViewFiles}
        agentName={agentName}
        disableInitialAnimation={disableInitialAnimation}
        isLeftSidebarExpanded={isLeftSidebarExpanded}
        threadId={threadId}
        agentRunId={agentRunId}
        onPanelWidthChange={setPanelWidth}
      />

      {sandboxId && (
        <FileViewerModal
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          sandboxId={sandboxId}
          initialFilePath={fileToView}
          project={project || undefined}
          filePathList={filePathList}
          editable={inTakeover}
          onFileEdited={async ({ path, bytes }) => {
            try {
              await onLogManual?.({ event_type: 'file_edit', data: { path, bytes } });
            } catch {}
          }}
        />
      )}

      <BillingErrorAlert
        message={billingData.message}
        currentUsage={billingData.currentUsage}
        limit={billingData.limit}
        accountId={billingData.accountId}
        onDismiss={onDismissBilling}
        isOpen={showBillingAlert}
      />
    </div>
  );
}
