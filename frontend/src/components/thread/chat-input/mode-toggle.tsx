import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModeToggleProps {
  selectedMode: 'default' | 'agent';
  onModeChange: (mode: 'default' | 'agent') => void;
  disabled?: boolean;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
  className,
}) => {
  const isChatMode = selectedMode === 'default';

  return (
    <TooltipProvider>
      <div className={cn("flex items-center", className)}>
        <div className="relative bg-none h-8 border dark:border-muted-foreground/20 rounded-full p-0.5 flex items-center dakr:bg-background/30">
          {/* Animated sliding background */}
          <motion.div
            className={cn(
              "absolute w-9 h-6.5 rounded-full shadow-xs backdrop-blur-2xl bg-muted dark:bg-muted",              
            )}
            animate={{
              x: isChatMode ? 0 : 36, // 28px = gap (1) + width (6.5) + padding adjustments
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />

          {/* Chat Mode Tab */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center cursor-pointer justify-center w-9 h-6.5 rounded-full transition-all duration-200 z-10",
                  isChatMode 
                    ? "dark:text-foreground" 
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  if (!disabled) {
                    onModeChange('default');
                  }
                }}
                disabled={disabled}
              >
                <i className="ri-chat-1-line text-base" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="rounded-xl">
              <div className="text-center p-1">
                <div className="font-semibold text-base">Chat</div>
                <div className="text-xs text-sidebar/70 dark:text-muted max-w-[160px]">Answer everyday questions or chat before starting tasks</div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Agent Mode Tab */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center cursor-pointer justify-center w-9 h-6.5 rounded-full transition-all duration-200 z-10",
                  !isChatMode 
                    ? "dark:text-foreground" 
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  if (!disabled) {
                    onModeChange('agent');
                  }
                }}
                disabled={disabled}
              >
                <i className="ri-meteor-fill text-base" />          
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="rounded-xl">
              <div className="text-center p-1" >
                <div className="font-semibold text-base">Agent</div>
                <div className="text-xs text-sidebar/70 dark:text-muted max-w-[160px]">Tackle complex tasks and deliver results autonomously</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};
