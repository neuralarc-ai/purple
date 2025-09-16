'use client';

import * as React from 'react';
import Link from 'next/link';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { HeliumLogo } from '@/components/sidebar/helium-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFeatureFlags } from '@/lib/feature-flags';
import posthog from 'posthog-js';
import Image from 'next/image';
import { useUserProfileWithFallback } from '@/hooks/use-user-profile';
import { DagadModal } from './dagad-modal';

// Custom Plus Icon component using the plus.svg
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 5V19"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12H19"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Agent Icon component using the agent.svg
const AgentIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M17.3333 9.92285H6.66667C5.19391 9.92285 4 11.1627 4 12.6921V18.2305C4 19.7599 5.19391 20.9998 6.66667 20.9998H17.3333C18.8061 20.9998 20 19.7599 20 18.2305V12.6921C20 11.1627 18.8061 9.92285 17.3333 9.92285Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.99984 16.8464C8.73622 16.8464 9.33317 16.2265 9.33317 15.4618C9.33317 14.6971 8.73622 14.0771 7.99984 14.0771C7.26346 14.0771 6.6665 14.6971 6.6665 15.4618C6.6665 16.2265 7.26346 16.8464 7.99984 16.8464Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.9998 16.8464C16.7362 16.8464 17.3332 16.2265 17.3332 15.4618C17.3332 14.6971 16.7362 14.0771 15.9998 14.0771C15.2635 14.0771 14.6665 14.6971 14.6665 15.4618C14.6665 16.2265 15.2635 16.8464 15.9998 16.8464Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 4V9.53846"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.9998 5.76923C12.7362 5.76923 13.3332 5.14932 13.3332 4.38462C13.3332 3.61991 12.7362 3 11.9998 3C11.2635 3 10.6665 3.61991 10.6665 4.38462C10.6665 5.14932 11.2635 5.76923 11.9998 5.76923Z"
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Bot Icon component for My Agents section
const BotIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M11 1V2H7C5.34315 2 4 3.34315 4 5V8C4 10.7614 6.23858 13 9 13H15C17.7614 13 20 10.7614 20 8V5C20 3.34315 18.6569 2 17 2H13V1H11ZM6 5C6 4.44772 6.44772 4 7 4H17C17.5523 4 18 4.44772 18 5V8C18 9.65685 16.6569 11 15 11H9C7.34315 11 6 9.65685 6 8V5ZM9.5 9C10.3284 9 11 8.32843 11 7.5C11 6.67157 10.3284 6 9.5 6C8.67157 6 8 6.67157 8 7.5C8 8.32843 8.67157 9 9.5 9ZM14.5 9C15.3284 9 16 8.32843 16 7.5C16 6.67157 15.3284 6 14.5 6C13.6716 6 13 6.67157 13 7.5C13 8.32843 13.6716 9 14.5 9ZM6 22C6 18.6863 8.68629 16 12 16C15.3137 16 18 18.6863 18 22H20C20 17.5817 16.4183 14 12 14C7.58172 14 4 17.5817 4 22H6Z"></path>
  </svg>
);

// Custom Prompt Library Icon component
const PromptLibraryIcon = ({ className }: { className?: string }) => (
  <i className={`ri-booklet-line text-base ${className}`} />
);

// Custom New Task Icon component
const NewTaskIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M13.0001 10.9999L22.0002 10.9997L22.0002 12.9997L13.0001 12.9999L13.0001 21.9998L11.0001 21.9998L11.0001 12.9999L2.00004 13.0001L2 11.0001L11.0001 10.9999L11 2.00025L13 2.00024L13.0001 10.9999Z"></path>
  </svg>
);

// Floating mobile menu button component
function FloatingMobileMenuButton() {
  const { setOpenMobile, openMobile } = useSidebar();
  const isMobile = useIsMobile();

  if (!isMobile || openMobile) return null;

  return (
    <div className="fixed top-1 left-0 z-50 md:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpenMobile(true)}
            size="icon"
            className="h-12 w-12 rounded-full bg-transparent text-foreground shadow-none hover:bg-transparent transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
            aria-label="Open menu"
          >
            <Image
              src="/icons/menu-light.svg"
              alt="menu Light Logo"
              width={22}
              height={22}
              className="block dark:hidden mb-0"
            />
            <Image
              src="/icons/menu-dark.svg"
              alt="menu Dark Logo"
              width={22}
              height={22}
              className="hidden dark:block mb-0"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Open menu</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { flags, loading: flagsLoading } = useFeatureFlags(['custom_agents']);
  const customAgentsEnabled = flags.custom_agents;
  const { preferredName, profile } = useUserProfileWithFallback();
  const [showDagadModal, setShowDagadModal] = useState(false);

  // Close mobile menu on page navigation
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, searchParams, isMobile, setOpenMobile]);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUser({
          name:
            preferredName ||
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
        });
      }
    };

    fetchUserData();
  }, [preferredName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setOpen(!state.startsWith('expanded'));
        window.dispatchEvent(
          new CustomEvent('sidebar-left-toggled', {
            detail: { expanded: !state.startsWith('expanded') },
          }),
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, setOpen]);

  return (
    <Sidebar
      collapsible="icon"
      className="bg-background/95 backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      {...props}
    >
      <SidebarHeader className="py-2">
        <div className={cn("flex h-[40px] items-center px-1.5 relative", {
          "pl-4": state !== 'collapsed'
        })}>
          <Link
            href="/dashboard"
            className="flex-shrink-0"
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <HeliumLogo size={18} />
          </Link>
          {state !== 'collapsed' && (
            <div className="ml-2 transition-all duration-300 ease-in-out whitespace-nowrap"></div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {state !== 'collapsed' && !isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8" />
                </TooltipTrigger>
                <TooltipContent side="right" align="center">Toggle sidebar (CMD+B)</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {state === 'collapsed' && !isMobile &&  (
          <div className="mt-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="h-8 w-8" />
              </TooltipTrigger>
              <TooltipContent side="right" align="center">Toggle sidebar (CMD+B)</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pt-0">
        <SidebarGroup className="space-y-1">
          <Link href="/dashboard">
            <SidebarMenuButton
              className={cn('touch-manipulation transition-all duration-300 ease-in-out', {
                'bg-accent px-4 text-accent-foreground font-medium':
                  pathname === '/dashboard',
              })}
              onClick={() => {
                posthog.capture('new_task_clicked');
                if (isMobile) setOpenMobile(false);
              }}
              tooltip="New Task"
            >
              <NewTaskIcon className="mr-1 transition-all duration-300 ease-in-out" />
              <span className="flex items-center justify-between w-full transition-all duration-300 ease-in-out">
                New Task
              </span>
            </SidebarMenuButton>
          </Link>
          <SidebarMenuButton
            className="touch-manipulation transition-all duration-300 ease-in-out"
            onClick={() => {
              setShowDagadModal(true);
              if (isMobile) setOpenMobile(false);
            }}
            tooltip="Knowledge Base"
          >
            <i className="ri-book-open-line text-base mr-1 transition-all duration-300 ease-in-out" />
            <span className="flex items-center justify-between w-full transition-all duration-300 ease-in-out">
              Knowledge Base
            </span>
          </SidebarMenuButton>
          {!flagsLoading && customAgentsEnabled && (
            <Link href="/agents?tab=my-agents">
              <SidebarMenuButton
                className={cn('touch-manipulation transition-all duration-300 ease-in-out', {
                  'bg-accent px-4 text-accent-foreground font-medium':
                    pathname === '/agents',
                })}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
                tooltip="Agents"
              >
                <BotIcon className="mr-1.5 transition-all duration-300 ease-in-out" />
                <span className="flex items-center justify-between w-full transition-all duration-300 ease-in-out">
                  My Agents
                </span>
              </SidebarMenuButton>
            </Link>
          )}

          {/* Prompt Library */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/prompt-library'}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
                className="touch-manipulation px-4 transition-all duration-300 ease-in-out"
                tooltip="Prompt Library"
              >
                <Link href="/prompt-library" className="flex items-center">
                  <PromptLibraryIcon className="mr-1.5 transition-all duration-300 ease-in-out" />
                  <span className="transition-all duration-300 ease-in-out">Prompt Library</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavAgents />
      </SidebarContent>
      {/* {state !== 'collapsed' && (
        <div className="px-3 py-2">
          <CTACard />
        </div>
      )} */}
      <SidebarFooter>
        <NavUserWithTeams user={user} />
      </SidebarFooter>
      <SidebarRail />
      
      {/* DAGAD Modal */}
      <DagadModal 
        open={showDagadModal} 
        onOpenChange={setShowDagadModal} 
      />
    </Sidebar>
  );
}

// Export the floating button so it can be used in the layout
export { FloatingMobileMenuButton };
