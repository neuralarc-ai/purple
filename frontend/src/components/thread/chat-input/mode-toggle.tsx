import React from 'react';
import { cn } from '@/lib/utils';
import { Atom, MessageCircle, MessageSquare } from 'lucide-react';
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
        <div className="relative bg-none h-8 border dark:border-muted-foreground/30 rounded-full p-1 flex items-center gap-1">
          {/* Animated sliding background */}
          <motion.div
            className={cn(
              "absolute w-6 h-6 rounded-full backdrop-blur-2xl",
              isChatMode ? "bg-helium-yellow" : "bg-helium-green"
            )}
            animate={{
              x: isChatMode ? 0 : 28, // 28px = gap (1) + width (6.5) + padding adjustments
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
                  "relative flex items-center cursor-pointer justify-center w-6 h-6 rounded-full transition-all duration-200 z-10",
                  isChatMode 
                    ? "dark:text-muted" 
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  if (!disabled) {
                    onModeChange('default');
                  }
                }}
                disabled={disabled}
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
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
                  "relative flex items-center cursor-pointer justify-center w-6 h-6 rounded-full transition-all duration-200 z-10",
                  !isChatMode 
                    ? "dark:text-muted " 
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  if (!disabled) {
                    onModeChange('agent');
                  }
                }}
                disabled={disabled}
              >
                <Atom className="h-4 w-4" strokeWidth={1.5} />          
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
