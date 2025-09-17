'use client';

import React, { useEffect, useState } from 'react';
import { SidebarLeft, FloatingMobileMenuButton } from '@/components/sidebar/sidebar-left';
import { SidebarInset, SidebarProvider, ToolCallSidePanelProvider, useSidebar, useToolCallSidePanel } from '@/components/ui/sidebar';
// import { PricingAlert } from "@/components/billing/pricing-alert"
import { MaintenanceAlert } from '@/components/maintenance-alert';
import { useAccounts } from '@/hooks/use-accounts';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useApiHealth } from '@/hooks/react-query';
import { MaintenancePage } from '@/components/maintenance/maintenance-page';
import { DeleteOperationProvider } from '@/contexts/DeleteOperationContext';
import { StatusOverlay } from '@/components/ui/status-overlay';
import { MaintenanceNotice } from './maintenance-notice';
import { MaintenanceBanner } from './maintenance-banner';
import { useMaintenanceNoticeQuery } from '@/hooks/react-query/edge-flags';
import { createClient } from '@/lib/supabase/client';

import { useProjects, useThreads } from '@/hooks/react-query/sidebar/use-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { useUsageRealtime } from '@/hooks/useUsageRealtime';

interface DashboardLayoutContentProps {
  children: React.ReactNode;
}

export const LayoutContext = React.createContext({ isSidebarOverlaying: false });

function LayoutContentInner({ children, mantenanceBanner }: { children: React.ReactNode, mantenanceBanner: React.ReactNode }) {
  const { state: sidebarState } = useSidebar();
  const { isExpanded: isToolCallSidePanelExpanded } = useToolCallSidePanel();
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsLargeScreen(width > 1024);
      setIsMediumScreen(width >= 768 && width <= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const isSidebarOverlaying = (isLargeScreen || isMediumScreen) && sidebarState === 'expanded' && isToolCallSidePanelExpanded;

  return (
    <LayoutContext.Provider value={{ isSidebarOverlaying }}>
      <SidebarLeft />
      <SidebarInset>
        {mantenanceBanner}
        <div className="bg-background">{children}</div>
      </SidebarInset>
    </LayoutContext.Provider>
  );
}

export default function DashboardLayoutContent({
  children,
}: DashboardLayoutContentProps) {
  const maintenanceNoticeQuery = useMaintenanceNoticeQuery();
  // const [showPricingAlert, setShowPricingAlert] = useState(false)
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find((account) => account.personal_account);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Enable real-time updates for usage data across all dashboard pages
  useUsageRealtime(user?.id);
  const {
    data: healthData,
    isLoading: isCheckingHealth,
    error: healthError,
  } = useApiHealth();

  // Prefetch sidebar data for better mobile experience
  const { data: projects } = useProjects();
  const { data: threads } = useThreads();
  const { data: agentsResponse } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });

  useEffect(() => {
    // setShowPricingAlert(false)
    setShowMaintenanceAlert(false);
  }, []);

  // Log data prefetching for debugging
  useEffect(() => {
    if (isMobile) {
      console.log('📱 Mobile Layout - Prefetched data:', {
        projects: projects?.length || 0,
        threads: threads?.length || 0,
        agents: agentsResponse?.agents?.length || 0,
        accounts: accounts?.length || 0,
        user: !!user
      });
    }
  }, [isMobile, projects, threads, agentsResponse, accounts, user]);

  // API health is now managed by useApiHealth hook
  const isApiHealthy = healthData?.status === 'ok' && !healthError;

  // Check authentication status and invite code validation
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!isLoading && user) {
        try {
          const supabase = createClient();
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // No profile found - user needs invite code validation
            console.log('Dashboard: User needs invite code validation, redirecting to /invite');
            router.push('/invite');
            return;
          }
        } catch (error) {
          console.error('Error checking user profile in dashboard:', error);
          // On error, redirect to invite as a safety measure
          router.push('/invite');
          return;
        }
      }
      
      if (!isLoading && !user) {
        router.push('/auth');
      }
      
      setIsCheckingProfile(false);
    };

    checkUserProfile();
  }, [user, isLoading, router]);

  if (maintenanceNoticeQuery.data?.enabled) {
    const now = new Date();
    const startTime = new Date(maintenanceNoticeQuery.data.startTime);
    const endTime = new Date(maintenanceNoticeQuery.data.endTime);

    if (now > startTime) {
      return (
        <div className="w-screen h-screen flex items-center justify-center">
          <div className="max-w-xl">
            <MaintenanceNotice endTime={endTime.toISOString()} />
          </div>
        </div>
      );
    }
  }

  let mantenanceBanner: React.ReactNode | null = null;
  if (maintenanceNoticeQuery.data?.enabled) {
    mantenanceBanner = (
      <MaintenanceBanner
        startTime={maintenanceNoticeQuery.data.startTime}
        endTime={maintenanceNoticeQuery.data.endTime}
      />
    );
  }

  // Show loading state while checking auth, profile, or health
  if (isLoading || isCheckingProfile || isCheckingHealth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  // Show maintenance page if API is not healthy (but not during initial loading)
  if (!isCheckingHealth && !isApiHealthy) {
    return <MaintenancePage />;
  }

  return (
    <DeleteOperationProvider>
      <SubscriptionProvider>
        <ToolCallSidePanelProvider>
          <SidebarProvider>
            <LayoutContentInner mantenanceBanner={mantenanceBanner}>
              {children}
            </LayoutContentInner>

          {/* <PricingAlert 
          open={showPricingAlert} 
          onOpenChange={setShowPricingAlert}
          closeable={false}
          accountId={personalAccount?.account_id}
          /> */}

            <MaintenanceAlert
              open={showMaintenanceAlert}
              onOpenChange={setShowMaintenanceAlert}
              closeable={true}
            />

          {/* Status overlay for deletion operations */}
            <StatusOverlay />
            <FloatingMobileMenuButton />
          </SidebarProvider>
        </ToolCallSidePanelProvider>
      </SubscriptionProvider>
    </DeleteOperationProvider>
  );
}
