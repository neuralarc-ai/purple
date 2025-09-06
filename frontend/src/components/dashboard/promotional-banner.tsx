'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PromotionalBannerProps {
  className?: string;
  onUpgradeClick?: () => void;
}

export function PromotionalBanner({ className, onUpgradeClick }: PromotionalBannerProps) {
  return (
    <div className={cn(
      "w-full flex justify-center py-2 px-4 mt-6",
      className
    )}>
      <div className="border border-border bg-background/50 backdrop-blur-sm px-4 py-2 rounded-md max-w-2xl w-full text-center transition-all duration-300 hover:border-primary/50 hover:bg-background/80 hover:shadow-md hover:scale-[1.02]">
        <p className="text-sm md:text-base font-semibold text-foreground transition-colors duration-300">
          Your Future with great features awaits. Claim 30% off + Early Access before it's gone.{' '}
          <button 
            onClick={onUpgradeClick}
            className="underline hover:no-underline text-primary font-medium transition-all duration-200 hover:text-primary/80 hover:font-bold cursor-pointer"
          >
            Click Here
          </button>
        </p>
      </div>
    </div>
  );
}