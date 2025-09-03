'use client';

import { useMemo, useState } from 'react';
import { BillingModal } from '@/components/billing/billing-modal';
import {
  CreditBalanceDisplay,
  CreditPurchaseModal
} from '@/components/billing/credit-purchase';
import { useAccounts } from '@/hooks/use-accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { isLocalMode } from '@/lib/config';
import Link from 'next/link';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

interface PersonalAccountBillingPageProps {
  onTabChange?: (tab: string) => void;
}

export function PersonalAccountBillingPage({ onTabChange }: PersonalAccountBillingPageProps) {
  const { data: accounts, isLoading, error } = useAccounts();
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSharedSubscription();

  const personalAccount = useMemo(
    () => accounts?.find((account) => account.personal_account),
    [accounts],
  );

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load account data'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!personalAccount) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Account Not Found</AlertTitle>
        <AlertDescription>
          Your personal account could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3 pt-1 md:pt-0">
      <BillingModal
        open={showBillingModal}
        onOpenChange={setShowBillingModal}
        returnUrl={typeof window !== 'undefined' ? window.location.href : '/'}
      />

      {isLocalMode() ? (
        <div className="p-3 mb-3 bg-muted/30 border border-border rounded-lg text-center">
          <p className="text-xs text-muted-foreground">
            Running in local development mode - billing features are disabled
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agent usage limits are not enforced in this environment
          </p>
        </div>
      ) : subscriptionLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : subscriptionError ? (
        <div className="p-3 mb-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <p className="text-xs text-destructive">
            Error loading billing status: {subscriptionError.message}
          </p>
        </div>
      ) : (
        <>
          {subscriptionData && (
            <div className="mb-3">
              <div className="rounded-lg bg-white dark:bg-background p-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">
                        Usage This Month
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <span className="text-sm font-medium text-foreground">Total Used</span>
                        <span className="text-lg font-bold text-primary">
                          {Math.round((subscriptionData.current_usage || 0) * 100)} credits
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                        <span className="text-sm text-muted-foreground">From subscription</span>
                        <span className="text-sm font-medium">
                          {Math.min(Math.round((subscriptionData.current_usage || 0) * 100), Math.round((subscriptionData.cost_limit || 0) * 100))} / {Math.round((subscriptionData.cost_limit || 0) * 100)} credits
                        </span>
                      </div>
                      {subscriptionData.current_usage && subscriptionData.cost_limit && 
                       (subscriptionData.current_usage * 100) > (subscriptionData.cost_limit * 100) && (
                        <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                          <span className="text-sm text-muted-foreground">From add-on balance</span>
                          <span className="text-sm font-medium">
                            {Math.round(((subscriptionData.current_usage || 0) - (subscriptionData.cost_limit || 0)) * 100)} credits
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant='outline' 
                    size="sm"
                    className='text-xs h-8 px-3 flex-shrink-0'
                    onClick={() => onTabChange?.('usage-logs')}
                  >
                    Usage logs
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Credit Balance Display - Only show for users who can purchase credits */}
          {subscriptionData?.can_purchase_credits && (
            <div className="mb-3">
              <div className="rounded-lg bg-white dark:bg-background p-3">
                <CreditBalanceDisplay
                  balance={subscriptionData.credit_balance_credits || Math.round((subscriptionData.credit_balance || 0) * 100)}
                  canPurchase={subscriptionData.can_purchase_credits}
                  onPurchaseClick={() => setShowCreditPurchaseModal(true)}
                  subscriptionData={subscriptionData}
                />
              </div>
            </div>
          )}

          <div className='flex justify-center items-center gap-3'>
            <Button
              size="sm"
              onClick={() => setShowBillingModal(true)}
              className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all h-8 px-4"
            >
              Manage Subscription
            </Button>
          </div>
        </>
      )}

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        open={showCreditPurchaseModal}
        onOpenChange={setShowCreditPurchaseModal}
        currentBalance={subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100)}
        canPurchase={subscriptionData?.can_purchase_credits || false}
        onPurchaseComplete={() => {
          // Optionally refresh subscription data here
          window.location.reload();
        }}
      />
    </div>
  );
}
