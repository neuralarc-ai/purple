import React from 'react';
import { cn } from '@/lib/utils';
import { Atom, MessageCircle, MessageSquare } from 'lucide-react';
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
    <div className={cn("flex items-center", className)}>
      <div className="relative bg-none h-8 border border-muted-foreground/30 rounded-full p-0.5 flex items-center gap-1">
        {/* Animated sliding background */}
        <motion.div
          className="absolute top-0.5 bottom-0.5 w-6.5 h-6.5 rounded-full bg-gradient-to-br from-helium-yellow to-helium-blue shadow-sm backdrop-blur-2xl"
          animate={{
            x: isChatMode ? 0 : 30, // 28px = gap (1) + width (6.5) + padding adjustments
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />

        {/* Chat Mode Tab */}
        <button
          className={cn(
            "relative flex items-center cursor-pointer justify-center w-6.5 h-6.5 rounded-full transition-all duration-200 z-10",
            isChatMode 
              ? "text-muted" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            if (!disabled) {
              onModeChange('default');
            }
          }}
          disabled={disabled}
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Agent Mode Tab */}
        <button
          className={cn(
            "relative flex items-center cursor-pointer justify-center w-6.5 h-6.5 rounded-full transition-all duration-200 z-10",
            !isChatMode 
              ? "text-muted" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            if (!disabled) {
              onModeChange('agent');
            }
          }}
          disabled={disabled}
        >
          <Atom className="h-3.5 w-3.5" strokeWidth={1.5} />          
        </button>
      </div>
    </div>
  );
};
