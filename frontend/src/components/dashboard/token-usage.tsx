'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { CreditPurchaseModal } from '@/components/billing/credit-purchase';

interface TokenUsageProps {
  className?: string;
  onUpgradeClick?: () => void;
  onViewUsageClick?: () => void;
}

export function TokenUsage({ className, onUpgradeClick, onViewUsageClick }: TokenUsageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const { data: subscriptionData } = useSharedSubscription();

  // Calculate credits
  const totalCreditsUsed = subscriptionData?.current_usage 
    ? Math.round((subscriptionData.current_usage) * 100) 
    : 0;
  
  const totalCreditsLimit = subscriptionData?.cost_limit 
    ? Math.round((subscriptionData.cost_limit) * 100) 
    : 0;
  
  const creditsRemaining = Math.max(0, totalCreditsLimit - totalCreditsUsed);
  
  const isFreePlan = subscriptionData?.plan_name === 'free';

  const handleAddCredits = () => {
    setShowCreditPurchaseModal(true);
  };

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };


  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
    >
      <div
        className={cn(
          "token-usage-container relative flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-full transition-all duration-300 cursor-pointer overflow-hidden",
          isHovered && "bg-primary/10 border-primary/20",
          className
        )}
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
          {creditsRemaining.toLocaleString()}
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

      {/* Dropdown on Hover */}
      {isHovered && (
        <div 
          className="token-usage-container absolute top-full right-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-50 p-4"
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="space-y-3">
            {/* Header with Plan Name and Add Credits Button */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {subscriptionData?.plan_name === 'free' ? 'Free' : subscriptionData?.plan_name || 'Free'}
              </span>
              <Button
                variant="default"
                size="sm"
                className="text-xs h-6 px-2 bg-white text-black hover:bg-gray-100 rounded"
                onClick={handleAddCredits}
              >
                Add Credits
              </Button>
            </div>
            
            {/* Divider */}
            <div className="border-t border-border" />
            
            {/* Credits Remaining */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credits remaining</span>
              <span className="text-sm font-medium text-foreground">{creditsRemaining.toLocaleString()}</span>
            </div>
            
            {/* Credits Used */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credits Used</span>
              <span className="text-sm font-medium text-foreground">
                {totalCreditsUsed.toLocaleString()} out of {totalCreditsLimit.toLocaleString()}
              </span>
            </div>
            
            <div className="border-t border-border pt-3">
              {/* View Usage Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-sm"
                onClick={onViewUsageClick}
              >
                <span>View usage</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        open={showCreditPurchaseModal}
        onOpenChange={setShowCreditPurchaseModal}
        currentBalance={subscriptionData?.credit_balance_credits || 0}
        canPurchase={true}
        onPurchaseComplete={() => {
          setShowCreditPurchaseModal(false);
        }}
      />
    </div>
  );
}
