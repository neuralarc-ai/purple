import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowUp,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { UploadedFile } from './chat-input';
import { VoiceRecorder } from './voice-recorder';
import { UnifiedConfigMenu } from './unified-config-menu';
import { SubscriptionStatus } from './_use-model-selection';
import { useFeatureFlag } from '@/lib/feature-flags';
import { BillingModal } from '@/components/billing/billing-modal';
import { handleFiles } from './file-upload-handler';
import { improvePromptWithGemini } from '@/lib/prompt-improvement-api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isProductionMode } from '@/lib/config';

// Custom Attach Icon component
const AttachIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M14 13.5V8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8V13.5C6 17.0899 8.91015 20 12.5 20C16.0899 20 19 17.0899 19 13.5V4H21V13.5C21 18.1944 17.1944 22 12.5 22C7.80558 22 4 18.1944 4 13.5V8C4 4.68629 6.68629 2 10 2C13.3137 2 16 4.68629 16 8V13.5C16 15.433 14.433 17 12.5 17C10.567 17 9 15.433 9 13.5V8H11V13.5C11 14.3284 11.6716 15 12.5 15C13.3284 15 14 14.3284 14 13.5Z"></path>
  </svg>
);

// Custom Connect Apps Icon component
const ConnectAppsIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M2.5 7C2.5 9.48528 4.51472 11.5 7 11.5C9.48528 11.5 11.5 9.48528 11.5 7C11.5 4.51472 9.48528 2.5 7 2.5C4.51472 2.5 2.5 4.51472 2.5 7ZM2.5 17C2.5 19.4853 4.51472 21.5 7 21.5C9.48528 21.5 11.5 19.4853 11.5 17C11.5 14.5147 9.48528 12.5 7 12.5C4.51472 12.5 2.5 14.5147 2.5 17ZM12.5 17C12.5 19.4853 14.5147 21.5 17 21.5C19.4853 21.5 21.5 19.4853 21.5 17C21.5 14.5147 19.4853 12.5 17 12.5C14.5147 12.5 12.5 14.5147 12.5 17ZM9.5 7C9.5 8.38071 8.38071 9.5 7 9.5C5.61929 9.5 4.5 8.38071 4.5 7C4.5 5.61929 5.61929 4.5 7 4.5C8.38071 4.5 9.5 5.61929 9.5 7ZM9.5 17C9.5 18.3807 8.38071 19.5 7 19.5C5.61929 19.5 4.5 18.3807 4.5 17C4.5 15.6193 5.61929 14.5 7 14.5C8.38071 14.5 9.5 15.6193 9.5 17ZM19.5 17C19.5 18.3807 18.3807 19.5 17 19.5C15.6193 19.5 14.5 18.3807 14.5 17C14.5 15.6193 15.6193 14.5 17 14.5C18.3807 14.5 19.5 15.6193 19.5 17ZM16 11V8H13V6H16V3H18V6H21V8H18V11H16Z"></path>
  </svg>
);

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTranscription: (text: string) => void;
  onStopListening?: () => void;
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
  selectedMode?: string; // Add selectedMode prop
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
      onStopListening,
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
      selectedMode = 'agent', // Default to agent mode
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
    const result = await improvePromptWithGemini(value);
        
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
              "w-full text-black dark:text-white bg-transparent dark:bg-transparent md:text-base md:placeholder:text-base border-none shadow-none focus-visible:ring-0 px-1 pb-8 pt-2 min-h-[80px] max-h-[200px] overflow-y-auto resize-none font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif] scrollbar-hide",
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
            {!hideAttachments && (
              <>
                {/* Attachment Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="w-8 h-8 p-0 border-none flex-shrink-0 shadow-none rounded-full transition-all duration-200 dark:bg-sidebar hover:bg-background/50!"
                      disabled={
                        !isLoggedIn ||
                        loading ||
                        (disabled && !isAgentRunning) ||
                        isUploading
                      }
                      onClick={handleFileUpload}
                    >
                      <AttachIcon className="h-4.5! w-4.5! text-foreground" />
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
                        className="w-8 h-8 border-none flex-shrink-0 shadow-none rounded-full transition-all duration-200 dark:bg-sidebar hover:bg-background/50!"
                        disabled={
                          !isLoggedIn ||
                          loading ||
                          (disabled && !isAgentRunning) ||
                          isUploading
                        }
                        onClick={onOpenIntegrations}
                      >
                        <ConnectAppsIcon className="h-4.5! w-4.5! text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Connect apps</p>
                    </TooltipContent>
                  </Tooltip>
                )}

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
                onStopListening={onStopListening}
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
                  ? 'bg-helium-purple hover:bg-helium-purple/80'
                  : 'bg-helium-purple hover:bg-helium-purple/80',
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
                  <ArrowUp className="h-5! w-5! text-white" />
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
