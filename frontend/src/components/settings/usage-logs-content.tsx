'use client';

import { createClient } from '@/lib/supabase/client';
import UsageLogs from '@/components/billing/usage-logs';
import { useEffect, useState } from 'react';

export function PersonalAccountUsageLogsPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountId();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading usage logs...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load usage logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UsageLogs accountId={accountId} />
    </div>
  );
}
