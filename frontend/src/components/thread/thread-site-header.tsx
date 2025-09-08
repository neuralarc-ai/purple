'use client';

import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useRef, KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { useUpdateProject } from "@/hooks/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { ShareModal } from "@/components/sidebar/share-modal"
import { useQueryClient } from "@tanstack/react-query";
import { threadKeys } from "@/hooks/react-query/threads/keys";
import Image from 'next/image';
import { useFeatureFlags } from "@/lib/feature-flags";
import { useThreadTokenUsage } from "@/hooks/react-query/threads/use-thread-token-usage";
import { useUsageRealtime } from "@/hooks/useUsageRealtime";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

interface ThreadSiteHeaderProps {
  threadId: string;
  projectId: string;
  projectName: string;
  createdAt?: string;
  onViewFiles: () => void;
  onToggleSidePanel: () => void;
  onProjectRenamed?: (newName: string) => void;
  isMobileView?: boolean;
  debugMode?: boolean;
  isSidePanelOpen?: boolean;
  agentStatus?: 'idle' | 'running' | 'connecting' | 'paused' | 'error';
  paused?: boolean;
  inTakeover?: boolean;
  onTakeoverToggle?: () => void;
}

export function SiteHeader({
  threadId,
  projectId,
  projectName,
  createdAt,
  onViewFiles,
  onProjectRenamed,
  isMobileView,
  debugMode,
  isSidePanelOpen,
  agentStatus,  
}: ThreadSiteHeaderProps) {
  const pathname = usePathname()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(projectName)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showShareModal, setShowShareModal] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const queryClient = useQueryClient();
  const { flags, loading: flagsLoading } = useFeatureFlags(['knowledge_base']);
  const knowledgeBaseEnabled = flags.knowledge_base;
  const { user } = useAuth();

  // Enable real-time updates for usage data
  useUsageRealtime(user?.id);

  // Get thread token usage with agent status for better real-time updates
  const { data: threadTokenUsage, isLoading: tokenUsageLoading, error: tokenUsageError } = useThreadTokenUsage(threadId, agentStatus);
  
  // Debug logging
  // console.log('Thread ID:', threadId);
  // console.log('Thread token usage:', threadTokenUsage);
  // console.log('Token usage loading:', tokenUsageLoading);
  // console.log('Token usage error:', tokenUsageError);

  const isMobile = useIsMobile() || isMobileView
  const updateProjectMutation = useUpdateProject()

  const openShareModal = () => {
    setShowShareModal(true)
  }

  const openKnowledgeBase = () => {
    setShowKnowledgeBase(true)
  }

  const startEditing = () => {
    setEditName(projectName);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(projectName);
  };

  const saveNewName = async () => {
    if (editName.trim() === '') {
      setEditName(projectName);
      setIsEditing(false);
      return;
    }

    if (editName !== projectName) {
      try {
        if (!projectId) {
          toast.error('Cannot rename: Project ID is missing');
          setEditName(projectName);
          setIsEditing(false);
          return;
        }

        const updatedProject = await updateProjectMutation.mutateAsync({
          projectId,
          data: { name: editName }
        })
        if (updatedProject) {
          onProjectRenamed?.(editName);
          queryClient.invalidateQueries({ queryKey: threadKeys.project(projectId) });
        } else {
          throw new Error('Failed to update project');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to rename project';
        console.error('Failed to rename project:', errorMessage);
        toast.error(errorMessage);
        setEditName(projectName);
      }
    }

    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveNewName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <>
      <header className={cn(
        "bg-background sticky top-0 md:pr-4 xl:pr-8 flex h-14 shrink-0 items-center gap-2 z-20 w-full",
        isMobile && "px-2"
      )}>

        <div className="flex flex-1 items-center gap-2 px-11">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveNewName}
              className="h-8 w-auto min-w-[180px] font-medium font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none focus-visible:bg-transparent bg-transparent shadow-none md:text-base p-0"
              maxLength={50}
            />
          ) : !projectName || projectName === 'Project' ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="text-base font-medium text-muted-foreground hover:text-foreground cursor-pointer flex items-center font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif] project-ellipsis"
                    onClick={startEditing}
                     title="Click to rename project"
                  >
                    {projectName}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="md:hidden">
                  {projectName}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
           
        </div>

        <div className="flex items-center gap-1 pr-4">
          {/* Debug mode indicator */}
          {debugMode && (
            <div className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-md mr-2">
              Debug
            </div>
          )}

          {/* Show all buttons on both mobile and desktop - responsive tooltips */}
          <TooltipProvider>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 cursor-pointer"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={isSidePanelOpen ? "end" : "start"} 
                className="w-80 mx-2"
                sideOffset={8}
              >
                <div className="p-2">
                  <p className="font-medium text-sm mb-2">Chat Details</p>
                  
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-xs text-muted-foreground w-20 whitespace-nowrap">Credits Used:</p>
                        {tokenUsageLoading ? (
                          <p className="text-xs text-muted-foreground">Loading...</p>
                        ) : threadTokenUsage ? (
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold text-muted-foreground">
                              {Math.round((threadTokenUsage.estimated_cost || 0) * 100).toLocaleString()}
                            </p>
                            {agentStatus === 'running' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Live updates enabled - credits will update automatically</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">0</p>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['thread-token-usage', threadId] })}
                            className="h-6 w-6 p-0 hover:bg-muted"
                            disabled={tokenUsageLoading}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Refresh credits usage</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                  </div>
                  
                  {createdAt && (
                    <div className="mb-2">
                      <div className="flex items-center">
                        <p className="text-xs text-muted-foreground w-20 whitespace-nowrap">Created at:</p>
                        <p className="text-xs font-mono">
                          {new Date(createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center">
                      <p className="text-xs text-muted-foreground w-20 whitespace-nowrap">Rate this task:</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-3 w-3 ${
                                star <= (hoverRating || rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onViewFiles}
                  className="h-9 w-9 cursor-pointer"
                >
                  <Image src="/icons/folder-open-light.svg" alt="folder open" width={21} height={21} className="block dark:hidden mb-0" />
                  <Image src="/icons/folder-open-dark.svg" alt="folder open" width={21} height={21} className="hidden dark:block mb-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "bottom" : "bottom"}>
                <p>View Files in Task</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openShareModal}
                  className="h-9 w-9 cursor-pointer"
                >
                 <Image src="/icons/share-light.svg" alt="share" width={16} height={16} className="block dark:hidden mb-0" />
                 <Image src="/icons/share-dark.svg" alt="share" width={16} height={16} className="hidden dark:block mb-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "bottom" : "bottom"}>
                <p>Share Chat</p>
              </TooltipContent>
            </Tooltip>

            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 cursor-pointer"
                    asChild
                  >
                    <AnimatedThemeToggler className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "bottom" : "bottom"}>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidePanel}
                  className="h-9 w-9 cursor-pointer"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "bottom" : "bottom"}>
                <p>Toggle Computer Preview (CMD+I)</p>
              </TooltipContent>
            </Tooltip> */}
          </TooltipProvider>
        </div>
      </header>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        threadId={threadId}
        projectId={projectId}
      />
      
    </>
  )
} 