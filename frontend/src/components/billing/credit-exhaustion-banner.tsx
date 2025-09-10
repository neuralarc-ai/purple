'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditPurchaseModal } from './credit-purchase';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';

interface CreditExhaustionBannerProps {
  onUpgrade?: () => void;
  className?: string;
}

export function CreditExhaustionBanner({ 
  onUpgrade, 
  className = '' 
}: CreditExhaustionBannerProps) {
  const [creditPurchaseModalOpen, setCreditPurchaseModalOpen] = React.useState(false);
  const { data: subscriptionData } = useSharedSubscription();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setCreditPurchaseModalOpen(true);
    }
  };

  return (
    <>
      <div className={`bg-gradient-to-r from-sidebar to-background rounded-2xl p-3 ${className} border border-black/15 dark:border-muted shadow-xs shadow-foreground/5 dark:shadow-sidebar-accent/30`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full border border-muted flex items-center justify-center bg-sidebar">
              <i className="ri-sparkling-line text-base z-50"></i>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Your credits have been used up. Please upgrade your plan for more credits.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <Button 
              onClick={handleUpgrade}
              className="bg-black hover:bg-foreground dark:bg-white text-white dark:text-black rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              Upgrade              
            </Button>
          </div>
        </div>
      </div>

      <CreditPurchaseModal
        open={creditPurchaseModalOpen}
        onOpenChange={setCreditPurchaseModalOpen}
        currentBalance={subscriptionData?.credit_balance_credits || 0}
        canPurchase={true}
        onPurchaseComplete={() => {
          setCreditPurchaseModalOpen(false);
        }}
      />
    </>
  );
}
