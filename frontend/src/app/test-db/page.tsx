'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DatabaseTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const testDatabaseConnection = async () => {
    setLoading(true);
    setTestResult('Testing database connection...\n');

    try {
      // Test 1: Check if feedback_tickets table exists
      setTestResult(prev => prev + '✓ Testing feedback_tickets table...\n');
      const { data: tableData, error: tableError } = await supabase
        .from('feedback_tickets')
        .select('*')
        .limit(1);

      if (tableError) {
        setTestResult(prev => prev + `✗ Table error: ${tableError.message}\n`);
        return;
      }
      setTestResult(prev => prev + '✓ feedback_tickets table accessible\n');

      // Test 2: Check if storage bucket exists
      setTestResult(prev => prev + '✓ Testing storage bucket...\n');
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from('feedback-screenshots')
        .list();

      if (bucketError) {
        setTestResult(prev => prev + `✗ Bucket error: ${bucketError.message}\n`);
        return;
      }
      setTestResult(prev => prev + '✓ feedback-screenshots bucket accessible\n');

      // Test 3: Check accounts table
      setTestResult(prev => prev + '✓ Testing accounts table...\n');
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id, personal_account, primary_owner_user_id')
        .limit(1);

      if (accountError) {
        setTestResult(prev => prev + `✗ Accounts error: ${accountError.message}\n`);
        return;
      }
      setTestResult(prev => prev + '✓ accounts table accessible\n');

      // Test 4: Check user authentication
      setTestResult(prev => prev + '✓ Testing user authentication...\n');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setTestResult(prev => prev + `✗ Auth error: ${userError.message}\n`);
        return;
      }

      if (user) {
        setTestResult(prev => prev + `✓ User authenticated: ${user.email}\n`);
      } else {
        setTestResult(prev => prev + '⚠ No user authenticated (this is normal if not logged in)\n');
      }

      setTestResult(prev => prev + '\n🎉 All tests passed! Database is ready for feedback submissions.\n');

    } catch (error) {
      setTestResult(prev => prev + `✗ Unexpected error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testDatabaseConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Database Connection'}
            </Button>
            
            {testResult && (
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {testResult}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
