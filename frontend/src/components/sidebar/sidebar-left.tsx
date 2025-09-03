'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ClipboardPen,
} from 'lucide-react';

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
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
        });
      }
    };

    fetchUserData();
  }, []);

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
            <div className="ml-2 transition-all duration-200 ease-in-out whitespace-nowrap"></div>
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
        {state === 'collapsed' && (
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
        <SidebarGroup className="space-y-2">
          <Link href="/dashboard">
            <SidebarMenuButton
              className={cn('touch-manipulation', {
                'bg-accent px-4 text-accent-foreground font-medium':
                  pathname === '/dashboard',
              })}
              onClick={() => {
                posthog.capture('new_task_clicked');
                if (isMobile) setOpenMobile(false);
              }}
              tooltip="New Task"
            >
              <Image
                src="/icons/plus-light.svg"
                alt="plus Light Logo"
                width={20}
                height={20}
                className="mr-1 block dark:hidden"
              />
              <Image
                src="/icons/plus-dark.svg"
                alt="plus Dark Logo"
                width={20}
                height={20}
                className="mr-1 hidden dark:block"
              />
              <span className="flex items-center justify-between w-full">
                New Task
              </span>
            </SidebarMenuButton>
          </Link>
          {!flagsLoading && customAgentsEnabled && (
            <Link href="/agents?tab=my-agents">
              <SidebarMenuButton
                className={cn('touch-manipulation', {
                  'bg-accent px-4 text-accent-foreground font-medium':
                    pathname === '/agents',
                })}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
                tooltip="Agents"
              >
                <Image
                  src="/icons/bot-light.svg"
                  alt="bot Light Logo"
                  width={20}
                  height={20}
                  className="mr-1 block dark:hidden"
                />
                <Image
                  src="/icons/bot-dark.svg"
                  alt="bot Dark Logo"
                  width={20}
                  height={20}
                  className="mr-1 hidden dark:block"
                />
                <span className="flex items-center justify-between w-full">
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
                className="touch-manipulation px-4.5"
                tooltip="Prompt Library"
              >
                <Link href="/prompt-library" className="flex items-center">
                  <ClipboardPen 
                    className="mr-1.5 h-5 w-5 stroke-[1.5]" 
                  />
                  <span>Prompt Library</span>
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
    </Sidebar>
  );
}

// Export the floating button so it can be used in the layout
export { FloatingMobileMenuButton };
