'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface TokenUsageProps {
  className?: string;
  onUpgradeClick?: () => void;
}

export function TokenUsage({ className, onUpgradeClick }: TokenUsageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: subscriptionData } = useSharedSubscription();

  // Calculate total credits used
  const totalCreditsUsed = subscriptionData?.current_usage 
    ? Math.round((subscriptionData.current_usage) * 100) 
    : 0;

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-full transition-all duration-300 cursor-pointer overflow-hidden",
        isHovered && "bg-primary/10 border-primary/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Custom Icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-muted-foreground flex-shrink-0"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M15.588 15.537l-3.553 -3.537l-7.742 8.18c-.791 .85 .153 2.18 1.238 1.73l9.616 -4.096a1.398 1.398 0 0 0 .44 -2.277z" />
        <path d="M8.412 8.464l3.553 3.536l7.742 -8.18c.791 -.85 -.153 -2.18 -1.238 -1.73l-9.616 4.098a1.398 1.398 0 0 0 -.44 2.277z" />
      </svg>
      
      {/* Credit Count */}
      <span className="text-sm font-medium text-foreground flex-shrink-0">
        {totalCreditsUsed.toLocaleString()}
      </span>
      
      {/* Vertical Separator - Only show when hovered */}
      <div className={cn(
        "w-px h-4 bg-border flex-shrink-0 transition-all duration-300",
        isHovered ? "opacity-100" : "opacity-0 w-0"
      )} />
      
      {/* Upgrade Text - Animated sliding from right */}
      <div className={cn(
        "relative overflow-hidden transition-all duration-300",
        isHovered ? "w-16" : "w-0"
      )}>
        <span 
          className={cn(
            "text-sm font-medium text-primary transition-transform duration-300 block whitespace-nowrap",
            isHovered 
              ? "translate-x-0" 
              : "translate-x-full"
          )}
        >
          Upgrade
        </span>
      </div>
    </div>
  );
}
