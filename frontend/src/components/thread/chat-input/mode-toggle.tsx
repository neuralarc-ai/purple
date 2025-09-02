import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <div className={cn("flex items-center gap-2", className)}>      
      <div 
        className={cn(
          "relative w-16 h-8 bg-gradient-to-r from-helium-blue/30 to-helium-green/30 backdrop-blur-sm rounded-full p-0.5 cursor-pointer overflow-hidden",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => {
          if (!disabled) {
            onModeChange(isChatMode ? 'agent' : 'default');
          }
        }}
      >
        <motion.div
          className="absolute top-0.5 bottom-0.5 bg-sidebar dark:bg-sidebar-accent rounded-full shadow-sm flex items-center justify-center w-12"
          animate={{
            x: isChatMode ? 0 : 12, // 12px = 0.75rem (small gap)
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <span className="text-xs font-medium text-muted-foreground">
            {isChatMode ? "Chat" : "Agent"}
          </span>
        </motion.div>
      </div>
    </div>
  );
};
