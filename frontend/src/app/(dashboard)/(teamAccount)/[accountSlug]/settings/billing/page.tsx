'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { BillingModal } from '@/components/billing/billing-modal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAccountBySlug } from '@/hooks/react-query';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { isLocalMode } from '@/lib/config';
import Link from 'next/link';
import { CreditBalanceDisplay, CreditPurchaseModal } from '@/components/billing/credit-purchase';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

type AccountParams = {
  accountSlug: string;
};

export default function TeamBillingPage({
  params,
}: {
  params: Promise<AccountParams>;
}) {
  const unwrappedParams = React.use(params);
  const { accountSlug } = unwrappedParams;
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);

  const { 
    data: teamAccount, 
    isLoading, 
    error 
  } = useAccountBySlug(accountSlug);

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSharedSubscription();

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

  if (!teamAccount) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Account Not Found</AlertTitle>
        <AlertDescription>
          The requested team account could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  if (teamAccount.role !== 'owner') {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <BillingModal 
        open={showBillingModal} 
        onOpenChange={setShowBillingModal}
        returnUrl={`${returnUrl}/${accountSlug}/settings/billing`}
      />
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
      
      <div>
        <h3 className="text-lg font-medium text-card-title">Team Billing</h3>
        <p className="text-sm text-foreground/70">
          Manage your team's subscription and billing details.
        </p>
      </div>

      {/* Billing Status Card */}
      <div className="rounded-xl border shadow-sm bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Billing Status</h2>

        {isLocalMode() ? (
          <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Running in local development mode - billing features are disabled
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Agent usage limits are not enforced in this environment
            </p>
          </div>
        ) : subscriptionLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : subscriptionError ? (
          <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <p className="text-sm text-destructive">
              Error loading billing status: {subscriptionError.message}
            </p>
          </div>
        ) : (
          <>
            {subscriptionData && (
              <div className="mb-6">
                <div className="rounded-lg border bg-gradient-to-br from-background to-muted/20 p-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
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
                    <Button variant='outline' asChild className='text-xs h-8 px-3 flex-shrink-0'>
                      <Link href={`/${accountSlug}/settings/usage-logs`}>
                        Usage logs
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Balance Display - Only show for users who can purchase credits */}
            {subscriptionData?.can_purchase_credits && (
              <div className="mb-6">
                <CreditBalanceDisplay 
                  balance={subscriptionData.credit_balance_credits || Math.round((subscriptionData.credit_balance || 0) * 100)}
                  canPurchase={subscriptionData.can_purchase_credits}
                  onPurchaseClick={() => setShowCreditPurchaseModal(true)}
                  subscriptionData={subscriptionData}
                />
              </div>
            )}

            <div className='flex justify-center items-center gap-4'>
              <Button
                onClick={() => setShowBillingModal(true)}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                Manage Subscription
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
