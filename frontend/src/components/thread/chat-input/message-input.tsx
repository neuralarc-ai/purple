import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowUp,
  Paperclip,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { UploadedFile } from './chat-input';
import { VoiceRecorder } from './voice-recorder';
import { UnifiedConfigMenu } from './unified-config-menu';
import { canAccessModel, SubscriptionStatus } from './_use-model-selection';
import { useFeatureFlag } from '@/lib/feature-flags';
import { BillingModal } from '@/components/billing/billing-modal';
import { handleFiles } from './file-upload-handler';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { improvePromptWithOpenRouter } from '@/lib/prompt-improvement-api';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ModeToggle } from './mode-toggle';
import { BorderBeam } from '@/components/magicui/border-beam';
import { isProductionMode } from '@/lib/config';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTranscription: (text: string) => void;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  isAgentRunning: boolean;
  onStopAgent?: () => void;
  isDraggingOver: boolean;
  uploadedFiles: UploadedFile[];

  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  sandboxId?: string;
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  hideAttachments?: boolean;
  messages?: any[]; // Add messages prop
  isLoggedIn?: boolean;

  selectedModel: string;
  onModelChange: (model: string) => void;
  modelOptions: any[];
  subscriptionStatus: SubscriptionStatus;
  canAccessModel: (modelId: string) => boolean;
  refreshCustomModels?: () => void;
  selectedAgentId?: string;
  onAgentSelect?: (agentId: string | undefined) => void;
  enableAdvancedConfig?: boolean;
  hideAgentSelection?: boolean;
  isHeliumAgent?: boolean;
  selectedMode: 'default' | 'agent';
  onModeChange: (mode: 'default' | 'agent') => void;
  // New props for integrations
  onOpenIntegrations?: () => void;
  onOpenInstructions?: () => void;
  onOpenKnowledge?: () => void;
  onOpenTriggers?: () => void;
  onOpenWorkflows?: () => void;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onTranscription,
      placeholder,
      loading,
      disabled,
      isAgentRunning,
      onStopAgent,
      isDraggingOver,
      uploadedFiles,

      fileInputRef,
      isUploading,
      sandboxId,
      setPendingFiles,
      setUploadedFiles,
      setIsUploading,
      hideAttachments = false,
      messages = [],
      isLoggedIn = true,

      selectedModel,
      onModelChange,
      modelOptions,
      subscriptionStatus,
      canAccessModel,
      refreshCustomModels,

      selectedAgentId,
      onAgentSelect,
      enableAdvancedConfig = false,
      hideAgentSelection = false,
      isHeliumAgent,
      selectedMode,
      onModeChange,
      onOpenIntegrations,
    },
    ref,
  ) => {
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
    const { enabled: customAgentsEnabled, loading: flagsLoading } =
      useFeatureFlag('custom_agents');
    const { resolvedTheme } = useTheme();
    const isMountedRef = useRef(true);

    useEffect(() => {
      setMounted(true);
      isMountedRef.current = true;
      
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      const textarea = ref as React.RefObject<HTMLTextAreaElement>;
      if (!textarea.current) return;

      const adjustHeight = () => {
        const el = textarea.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.maxHeight = '200px';
        el.style.overflowY = el.scrollHeight > 200 ? 'auto' : 'hidden';

        const newHeight = Math.min(el.scrollHeight, 200);
        el.style.height = `${newHeight}px`;
      };

      adjustHeight();

      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, [value, ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (
          (value.trim() || uploadedFiles.length > 0) &&
          !loading &&
          (!disabled || isAgentRunning)
        ) {
          // Pre-emptive loading state for Enter key submissions
          const textarea = e.currentTarget;
          textarea.disabled = true;
          textarea.style.opacity = '0.5';
          
          // Call onSubmit after a minimal delay to ensure loading state renders
          setTimeout(() => {
            onSubmit(e as unknown as React.FormEvent);
          }, 10);
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(
          imageFiles,
          sandboxId,
          setPendingFiles,
          setUploadedFiles,
          setIsUploading,
          messages,
        );
      }
    };

    const handleFileUpload = () => {
      if (fileInputRef && 'current' in fileInputRef && fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleImprovePrompt = async () => {
      if (!value.trim() || isImprovingPrompt || !isMountedRef.current) return;
      
      setIsImprovingPrompt(true);
      
      try {
        const result = await improvePromptWithOpenRouter(value);
        
        // Check if component is still mounted before updating state
        if (isMountedRef.current && result.success && result.improvedPrompt !== value) {
          // Apply the improved prompt with proper error handling
          try {
            const syntheticEvent = {
              target: { value: result.improvedPrompt },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
          } catch (error) {
            console.error('Error applying improved prompt:', error);
          }
        }
      } catch (error) {
        console.error('Failed to improve prompt:', error);
      } finally {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsImprovingPrompt(false);
        }
      }
    };    

    const processFileUpload = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (!event.target.files || event.target.files.length === 0) return;

      const files = Array.from(event.target.files);
      handleFiles(
        files,
        sandboxId,
        setPendingFiles,
        setUploadedFiles,
        setIsUploading,
        messages,
      );

      event.target.value = '';
    };

    const renderDropdown = () => {
      const showAdvancedFeatures =
        isLoggedIn &&
        (enableAdvancedConfig || (customAgentsEnabled && !flagsLoading));
      // Don't render dropdown components until after hydration to prevent ID mismatches
      if (!mounted) {
        return <div className="flex items-center gap-2 h-8" />; // Placeholder with same height
      }
      // Hide unified config menu in production
      if (isProductionMode()) {
        return <div className="flex items-center gap-2 h-8" />; // Placeholder with same height
      }
      // Unified compact menu for both logged and non-logged (non-logged shows only models subset via menu trigger)
      return (
        <div className="flex items-center gap-2 agent-selector ">
          <UnifiedConfigMenu
            isLoggedIn={isLoggedIn}
            selectedAgentId={
              showAdvancedFeatures && !hideAgentSelection
                ? selectedAgentId
                : undefined
            }
            onAgentSelect={
              showAdvancedFeatures && !hideAgentSelection
                ? onAgentSelect
                : undefined
            }
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            modelOptions={modelOptions}
            subscriptionStatus={subscriptionStatus}
            canAccessModel={canAccessModel}
            refreshCustomModels={refreshCustomModels}
          />
        </div>
      );
    };

    return (
      <div className="relative flex flex-col w-full h-full gap-2 justify-between">
        <div className="flex flex-col gap-1 px-2 relative">
          <Textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={cn(
              "w-full text-foreground bg-transparent dark:bg-transparent md:text-base md:placeholder:text-base border-none shadow-none focus-visible:ring-0 px-1 pb-8 pt-2 min-h-[100px] max-h-[200px] overflow-y-auto resize-none font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif] scrollbar-hide",
              isDraggingOver ? 'opacity-40' : '',
            )}
            disabled={loading || (disabled && !isAgentRunning)}
            rows={1}
          />
          {/* Subtle gradient overlay at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-white dark:from-bg-sidebar to-transparent pointer-events-none" />
        </div>

        <div className="flex items-center justify-between mt-0 mb-1 px-2">
          <div className="flex items-center gap-2">
            {/* Mode Toggle - Hidden for now */}
            {/* <ModeToggle
              selectedMode={selectedMode}
              onModeChange={onModeChange}
              disabled={loading || (disabled && !isAgentRunning)}
            /> */}
            
            {!hideAttachments && (
              <>
                {/* Attachment Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="w-8 h-8 flex-shrink-0 dark:border-muted-foreground/30 shadow-none rounded-full transition-all duration-200 bg-white dark:bg-sidebar hover:bg-background/50!"
                      disabled={
                        !isLoggedIn ||
                        loading ||
                        (disabled && !isAgentRunning) ||
                        isUploading
                      }
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground stroke-[1.5]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload files and more</p>
                  </TooltipContent>
                </Tooltip>

                {/* Integrations Button */}
                {selectedAgentId && onOpenIntegrations && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 flex-shrink-0 dark:border-muted-foreground/30 shadow-none rounded-full transition-all duration-200 bg-white dark:bg-sidebar hover:bg-background/50!"
                        disabled={
                          !isLoggedIn ||
                          loading ||
                          (disabled && !isAgentRunning) ||
                          isUploading
                        }
                        onClick={onOpenIntegrations}
                      >
                        <Image
                          src={
                            resolvedTheme === 'dark'
                              ? '/icons/integration-dark.svg'
                              : '/icons/integrations.svg'
                          }
                          alt="Integrations"
                          width={16}
                          height={16}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Connect apps</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Improve Prompt Button - Commented out */}
                {/* <Button
                  type="button"
                  variant="ghost"                  
                  onClick={handleImprovePrompt}
                  className={cn(
                    'h-8 w-8 bg-transparent dark:border-muted-foreground/30 shadow-none group transition-all duration-200 text-sm relative overflow-hidden',
                    'border border-muted-foreground/20 rounded-full bg-white dark:bg-sidebar hover:bg-background/50! ',
                    'disabled:opacity-100',
                    isImprovingPrompt && 'cursor-not-allowed border-none'
                  )}
                  disabled={
                    !isLoggedIn ||
                    loading ||
                    (disabled && !isAgentRunning) ||
                    !value.trim() ||
                    isImprovingPrompt
                  }
                  title="Improve Prompt with AI"
                >
                  {isImprovingPrompt && (
                    <BorderBeam 
                      duration={2}
                      borderWidth={1.5}
                      size={40}
                      className="from-helium-blue via-helium-green to-helium-yellow"
                    />
                  )}
                  <Wand2 className="h-4! w-4! text-muted-foreground" strokeWidth={1.5} />
                </Button> */}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={processFileUpload}
                  multiple
                />
              </>
            )}
            
            {uploadedFiles.length > 0 && selectedMode !== 'agent' && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Files require agent mode
              </span>
            )}
          </div>

          {/* {subscriptionStatus === 'no_subscription' && !isLocalMode() &&
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p role='button' className='text-sm text-amber-500 hidden sm:block cursor-pointer' onClick={() => setBillingModalOpen(true)}>Upgrade for more usage</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The free tier is severely limited by the amount of usage. Upgrade to experience the full power of Helium.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          } */}

          <div className="flex items-center gap-2">
            {renderDropdown()}
            <BillingModal
              open={billingModalOpen}
              onOpenChange={setBillingModalOpen}
              returnUrl={
                typeof window !== 'undefined' ? window.location.href : '/'
              }
            />

            {isLoggedIn && (
              <VoiceRecorder
                onTranscription={onTranscription}
                disabled={loading || (disabled && !isAgentRunning)}
              />
            )}

            <Button
              type="submit"
              onClick={(e) => {
                // Check if component is still mounted before proceeding
                if (!mounted) return;
                
                // Pre-emptive loading state - show loading immediately
                if (isAgentRunning && onStopAgent) {
                  onStopAgent();
                } else {
                  // Use React state instead of direct DOM manipulation
                  // The loading state will be handled by the parent component
                  // Call onSubmit after a minimal delay to ensure loading state renders
                  setTimeout(() => {
                    if (mounted) {
                      onSubmit(e);
                    }
                  }, 10);
                }
              }}
              size="icon"
              className={cn(
                'w-8 h-8 flex-shrink-0 rounded-full cursor-pointer',
                resolvedTheme === 'dark'
                  ? 'bg-helium-orange hover:bg-helium-orange/80'
                  : 'bg-helium-orange hover:bg-helium-orange/80',
                (!value.trim() &&
                  uploadedFiles.length === 0 &&
                  !isAgentRunning) ||
                  loading ||
                  (disabled && !isAgentRunning)
                  ? 'opacity-50'
                  : '',
              )}
              disabled={
                (!value.trim() &&
                  uploadedFiles.length === 0 &&
                  !isAgentRunning) ||
                loading ||
                (disabled && !isAgentRunning)
              }
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isAgentRunning ? (
                <div className="min-h-[12px] min-w-[12px] w-[12px] h-[12px] rounded-xs bg-white" />
              ) : (
                <div
                  className={
                    mounted && resolvedTheme === 'light'
                      ? 'text-white'
                      : 'text-white'
                  }
                >
                  <ArrowUp className="h-5 w-5 text" />
                </div>
              )}
            </Button>
          </div>
        </div>
        {/* {subscriptionStatus === 'no_subscription' && !isLocalMode() &&
          <div className='sm:hidden absolute -bottom-8 left-0 right-0 flex justify-center'>
            <p className='text-xs text-amber-500 px-2 py-1'>
              Upgrade for better performance
            </p>
          </div>
        } */}


      </div>
    );
  },
);

MessageInput.displayName = 'MessageInput';
