'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import UsageLogs from '@/components/billing/usage-logs';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

interface PersonalAccountBillingPageProps {
  onTabChange?: (tab: string) => void;
}

export function PersonalAccountBillingPage({ onTabChange }: PersonalAccountBillingPageProps) {
  const { data: accounts, isLoading, error } = useAccounts();
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSharedSubscription();

  // Load account ID for usage logs
  useEffect(() => {
    const loadAccountId = async () => {
      try {
        const supabaseClient = createClient();
        const { data: personalAccount } = await supabaseClient.rpc(
          'get_personal_account',
        );
        setAccountId(personalAccount.account_id);
      } catch (error) {
        console.error('Error loading account ID:', error);
      }
    };

    loadAccountId();
  }, []);

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
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Usage This Month
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const totalCredits = subscriptionData.credit_balance_credits || Math.round((subscriptionData.credit_balance || 0) * 100);
                      const costLimit = Math.round((subscriptionData.cost_limit || 0) * 100);
                      const currentUsage = Math.round((subscriptionData.current_usage || 0) * 100);
                      const freeCreditsUsed = Math.min(currentUsage, costLimit);
                      const freeCreditsLeft = Math.max(0, costLimit - freeCreditsUsed);
                      const addOnCreditsLeft = Math.max(0, totalCredits - freeCreditsLeft);
                      
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total credits left</span>
                            <span className="text-sm font-medium">{totalCredits} credits</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Free credits left</span>
                            <span className="text-sm font-medium">{freeCreditsLeft} / {costLimit}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Monthly credits left</span>
                            <span className="text-sm font-medium">0</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Add on credits left</span>
                            <span className="text-sm font-medium">{addOnCreditsLeft} credits</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='flex justify-center items-center gap-3'>
            {subscriptionData?.can_purchase_credits && (
              <Button
                size="sm"
                onClick={() => setShowCreditPurchaseModal(true)}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all h-8 px-4"
              >
                Add Credits
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowBillingModal(true)}
              className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all h-8 px-4"
            >
              Manage Subscription
            </Button>
          </div>

          {/* Usage Logs Section */}
          {accountId && (
            <div className="mt-6">
              <UsageLogs accountId={accountId} compact={true} />
            </div>
          )}
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
