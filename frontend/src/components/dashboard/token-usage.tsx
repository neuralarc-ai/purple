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
  const purchasedCreditsLeft = subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100);
  const totalRemainingCredits = creditsRemaining + purchasedCreditsLeft;
  
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
          "token-usage-container relative flex items-center gap-2 px-3 py-1.5 bg-muted/50 dark:bg-muted/30 border border-border rounded-full transition-all duration-300 cursor-pointer overflow-hidden",
          isHovered && "bg-sidebar/50 border-muted-foreground/20",
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
          {totalRemainingCredits.toLocaleString()}
        </span>
        
        {/* Vertical Separator - Show when hovered or when total remaining credits is 0 */}
        <div className={cn(
          "w-px h-4 bg-muted-foreground flex-shrink-0 transition-all duration-300",
          (isHovered || totalRemainingCredits === 0) ? "opacity-100" : "opacity-0 w-0"
        )} />
        
        {/* Upgrade Text - Animated sliding from right */}
        <div className={cn(
          "relative overflow-hidden transition-all duration-300",
          (isHovered || totalRemainingCredits === 0) ? "w-16" : "w-0"
        )}>
          <span 
            className={cn(
              "text-sm font-semibold text-helium-blue transition-transform duration-300 block whitespace-nowrap",
              (isHovered || totalRemainingCredits === 0)
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
          className="token-usage-container absolute top-full right-0 mt-1 w-64 bg-sidebar border dark:border-border rounded-3xl shadow-lg z-50 p-4 animate-in slide-in-from-right-4 fade-in duration-300"
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
                className="text-xs h-6 px-2 dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-gray-100 rounded-full"
                onClick={handleAddCredits}
              >
                Add Credits
              </Button>
            </div>
            
            {/* Divider */}
            <div className="border-t border-border" />
            
            {/* Total credits left */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total credits left</span>
              <span className="text-sm font-medium text-foreground">
                {totalRemainingCredits.toLocaleString()}
              </span>
            </div>
            
            {subscriptionData?.plan_name === 'free' ? (
              <>
                {/* Free credits left */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Free credits left</span>
                  <span className="text-sm font-medium text-foreground">
                    {creditsRemaining.toLocaleString()} / {totalCreditsLimit.toLocaleString()}
                  </span>
                </div>
                
                {/* Monthly credits left */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly credits left</span>
                  <span className="text-sm font-medium text-foreground">0</span>
                </div>
              </>
            ) : (
              <>
                {/* Monthly credits left */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly credits left</span>
                  <span className="text-sm font-medium text-foreground">
                    {creditsRemaining.toLocaleString()}
                  </span>
                </div>
                
                {/* Add on credits left */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Add on credits left</span>
                  <span className="text-sm font-medium text-foreground">
                    {(subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100)).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            
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