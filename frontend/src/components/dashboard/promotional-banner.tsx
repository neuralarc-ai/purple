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
      "w-full flex justify-center py-2 px-2 sm:px-4 mt-16 sm:mt-16 md:mt-18 lg:mt-10 xl:mt-6",
      className
    )}>
      <div className="border border-border bg-background/50 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-2 rounded-md max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md xl:max-w-2xl w-full text-center transition-all duration-300 hover:border-primary/50 hover:bg-background/80 hover:shadow-md hover:scale-[1.02]">
        <p className="text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-foreground transition-colors duration-300 leading-tight sm:leading-normal">
          <span className="block sm:inline lg:block xl:inline">Your Future with great features awaits.</span>
          <span className="hidden sm:inline lg:hidden xl:inline"> </span>
          <span className="block sm:inline lg:block xl:inline">Claim 30% off + Early Access before it's gone.</span>{' '}
          <button 
            onClick={onUpgradeClick}
            className="underline hover:no-underline text-primary font-medium transition-all duration-200 hover:text-primary/80 hover:font-bold cursor-pointer inline-block mt-1 sm:mt-0 lg:mt-1 xl:mt-0"
          >
            Click Here
          </button>
        </p>
      </div>
    </div>
  );
}