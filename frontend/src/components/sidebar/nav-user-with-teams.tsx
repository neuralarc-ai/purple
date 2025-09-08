'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Command,  
  AudioWaveform,
  ChevronsUpDown,
} from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import { useUserProfileWithFallback } from '@/hooks/use-user-profile';
import NewTeamForm from '@/components/basejump/new-team-form';
import { agentApi } from '@/lib/api-enhanced';
import BoringAvatar from 'boring-avatars';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { useFeatureFlag } from '@/lib/feature-flags';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSubscriptionData } from '@/contexts/SubscriptionContext';
import { useUsageRealtime } from '@/hooks/useUsageRealtime';
import { useAuth } from '@/components/AuthProvider';
import { BillingModal } from '@/components/billing/billing-modal';
import { SettingsModal } from '@/components/settings/settings-modal';


// Dynamic icon component that changes path based on theme
const DynamicIcon = ({
  lightPath,
  darkPath,
  alt,
  width,
  height,
  className,
}: {
  lightPath: string;
  darkPath: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) => {
  const { theme } = useTheme();
  const iconPath = theme === 'dark' ? darkPath : lightPath;

  return (
    <Image
      src={iconPath}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

// Custom Settings Icon component
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M12 14V16C8.68629 16 6 18.6863 6 22H4C4 17.5817 7.58172 14 12 14ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.21 11 16 9.21 16 7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7C8 9.21 9.79 11 12 11ZM14.5946 18.8115C14.5327 18.5511 14.5 18.2794 14.5 18C14.5 17.7207 14.5327 17.449 14.5945 17.1886L13.6029 16.6161L14.6029 14.884L15.5952 15.4569C15.9883 15.0851 16.4676 14.8034 17 14.6449V13.5H19V14.6449C19.5324 14.8034 20.0116 15.0851 20.4047 15.4569L21.3971 14.8839L22.3972 16.616L21.4055 17.1885C21.4673 17.449 21.5 17.7207 21.5 18C21.5 18.2793 21.4673 18.551 21.4055 18.8114L22.3972 19.3839L21.3972 21.116L20.4048 20.543C20.0117 20.9149 19.5325 21.1966 19.0001 21.355V22.5H17.0001V21.3551C16.4677 21.1967 15.9884 20.915 15.5953 20.5431L14.603 21.1161L13.6029 19.384L14.5946 18.8115ZM18 19.5C18.8284 19.5 19.5 18.8284 19.5 18C19.5 17.1716 18.8284 16.5 18 16.5C17.1716 16.5 16.5 17.1716 16.5 18C16.5 18.8284 17.1716 19.5 18 19.5Z"></path>
  </svg>
);

// Custom Subscription Icon component
const SubscriptionIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M20.0833 15.1999L21.2854 15.9212C21.5221 16.0633 21.5989 16.3704 21.4569 16.6072C21.4146 16.6776 21.3557 16.7365 21.2854 16.7787L12.5144 22.0412C12.1977 22.2313 11.8021 22.2313 11.4854 22.0412L2.71451 16.7787C2.47772 16.6366 2.40093 16.3295 2.54301 16.0927C2.58523 16.0223 2.64413 15.9634 2.71451 15.9212L3.9166 15.1999L11.9999 20.0499L20.0833 15.1999ZM20.0833 10.4999L21.2854 11.2212C21.5221 11.3633 21.5989 11.6704 21.4569 11.9072C21.4146 11.9776 21.3557 12.0365 21.2854 12.0787L11.9999 17.6499L2.71451 12.0787C2.47772 11.9366 2.40093 11.6295 2.54301 11.3927C2.58523 11.3223 2.64413 11.2634 2.71451 11.2212L3.9166 10.4999L11.9999 15.3499L20.0833 10.4999ZM12.5144 1.30864L21.2854 6.5712C21.5221 6.71327 21.5989 7.0204 21.4569 7.25719C21.4146 7.32757 21.3557 7.38647 21.2854 7.42869L11.9999 12.9999L2.71451 7.42869C2.47772 7.28662 2.40093 6.97949 2.54301 6.7427C2.58523 6.67232 2.64413 6.61343 2.71451 6.5712L11.4854 1.30864C11.8021 1.11864 12.1977 1.11864 12.5144 1.30864ZM11.9999 3.33233L5.88723 6.99995L11.9999 10.6676L18.1126 6.99995L11.9999 3.33233Z"></path>
  </svg>
);

export function NavUserWithTeams({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data: accounts } = useAccounts();
  const { profile, preferredName, isLoading: profileLoading, isAuthError } = useUserProfileWithFallback();
  
  // Debug: Log profile data to see what's being fetched
  React.useEffect(() => {
    console.log('NavUserWithTeams - Profile data:', profile);
    console.log('NavUserWithTeams - Profile avatar:', profile?.avatar);
  }, [profile]);
  
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
  const [showBillingModal, setShowBillingModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  
  const [editLoading, setEditLoading] = React.useState(false);
  const [tokenUsage, setTokenUsage] = React.useState(0);
  const [totalTokens, setTotalTokens] = React.useState(500);
  const { theme, setTheme } = useTheme();
  const { enabled: customAgentsEnabled, loading: flagLoading } =
    useFeatureFlag('custom_agents');
  
  // Get real-time subscription data for credit usage
  const { data: subscriptionData, refetch: refetchSubscription } = useSubscriptionData();
  const { user: authUser } = useAuth();

  // Enable real-time updates for usage data
  useUsageRealtime(authUser?.id);

  // Prepare personal account and team accounts
  const personalAccount = React.useMemo(
    () => accounts?.find((account) => account.personal_account),
    [accounts],
  );
  const teamAccounts = React.useMemo(
    () => accounts?.filter((account) => !account.personal_account),
    [accounts],
  );

  // Create a default list of teams with logos for the UI (will show until real data loads)
  const defaultTeams = [
    {
      name: personalAccount?.name || 'Personal Account',
      logo: Command,
      plan: 'Personal',
      account_id: personalAccount?.account_id,
      slug: personalAccount?.slug,
      personal_account: true,
    },
    ...(teamAccounts?.map((team) => ({
      name: team.name,
      logo: AudioWaveform,
      plan: 'Team',
      account_id: team.account_id,
      slug: team.slug,
      personal_account: false,
    })) || []),
  ];

  // Use the first team or first entry in defaultTeams as activeTeam
  const [activeTeam, setActiveTeam] = React.useState(defaultTeams[0]);

  // Update active team when accounts load
  React.useEffect(() => {
    if (accounts?.length) {
      const currentTeam = accounts.find(
        (account) => account.account_id === activeTeam.account_id,
      );
      if (currentTeam) {
        setActiveTeam({
          name: currentTeam.name,
          logo: currentTeam.personal_account ? Command : AudioWaveform,
          plan: currentTeam.personal_account ? 'Personal' : 'Team',
          account_id: currentTeam.account_id,
          slug: currentTeam.slug,
          personal_account: currentTeam.personal_account,
        });
      } else {
        // If current team not found, set first available account as active
        const firstAccount = accounts[0];
        setActiveTeam({
          name: firstAccount.name,
          logo: firstAccount.personal_account ? Command : AudioWaveform,
          plan: firstAccount.personal_account ? 'Personal' : 'Team',
          account_id: firstAccount.account_id,
          slug: firstAccount.slug,
          personal_account: firstAccount.personal_account,
        });
      }
    }
  }, [accounts, activeTeam.account_id]);

  // Handle team selection
  const handleTeamSelect = (team) => {
    setActiveTeam(team);

    // Navigate to the appropriate dashboard
    if (team.personal_account) {
      router.push('/dashboard');
    } else {
      router.push(`/${team.slug}`);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Fetch token usage
  const fetchTokenUsage = React.useCallback(async () => {
    try {
      // Replace this with your real API call
      const response = await fetch('/api/token-usage');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Token usage API response:', data);
      setTokenUsage(data.used_tokens);
    } catch (err) {
      console.error('Error fetching token usage:', err);
      console.log('Using fallback token usage: 22000');
      setTokenUsage(1222); // Fallback value
    }
  }, []);

  // Fetch token usage on component mount
  React.useEffect(() => {
    fetchTokenUsage();
  }, [fetchTokenUsage]);

  if (!activeTeam) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {profile?.avatar ? (
                  <div className="h-8 w-8 rounded-lg overflow-hidden">
                    {profile.avatar.startsWith('{') ? (
                      <BoringAvatar
                        name={preferredName || user.name}
                        colors={JSON.parse(profile.avatar).colors}
                        variant="beam"
                        size={32}
                      />
                    ) : (
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={profile.avatar} alt={preferredName || user.name} />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(preferredName || user.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ) : user.avatar ? (
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={preferredName || user.name} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(preferredName || user.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {getInitials(preferredName || user.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-lg font-bold">{preferredName || user.name}</span>
                  <span className="truncate text-sm">{user.email}</span>
                </div>
                {/* Show user avatar in collapsed state, more icon in expanded state */}
                <div className="ml-auto group-data-[collapsible=icon]:mr-2">
                  <div className="group-data-[collapsible=icon]:block hidden">
                    {profile?.avatar ? (
                      <div className="h-6 w-6 rounded-lg overflow-hidden">
                        {profile.avatar.startsWith('{') ? (
                          <BoringAvatar
                            name={preferredName || user.name}
                            colors={JSON.parse(profile.avatar).colors}
                            variant="beam"
                            size={24}
                          />
                        ) : (
                          <Avatar className="h-6 w-6 rounded-lg">
                            <AvatarImage src={profile.avatar} alt={preferredName || user.name} />
                            <AvatarFallback className="rounded-lg text-xs">
                              {getInitials(preferredName || user.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ) : user.avatar ? (
                      <Avatar className="h-6 w-6 rounded-lg">
                        <AvatarImage src={user.avatar} alt={preferredName || user.name} />
                        <AvatarFallback className="rounded-lg text-xs">
                          {getInitials(preferredName || user.name)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-6 w-6 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs">
                          {getInitials(preferredName || user.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <DynamicIcon
                      lightPath="/icons/more-horizontal-light.svg"
                      darkPath="/icons/more-horizontal-dark.svg"
                      alt="menu"
                      width={16}
                      height={16}
                      className="size-4"
                    />
                  </div>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 bg-background rounded-3xl p-2"
              side={isMobile ? 'bottom' : 'top'}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1.5 py-1.5 text-left text-sm">
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex items-center gap-2 group">
                      <span className="truncate font-medium">
                        {profileLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          preferredName || user.name
                        )}
                      </span>
                    </div>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              {/* Credit Usage Section */}
              {/* <div className="px-1.5 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">
                    {subscriptionData ? (
                      subscriptionData.current_usage && subscriptionData.cost_limit ? (
                        subscriptionData.current_usage >= subscriptionData.cost_limit 
                          ? "You have used 100% of your credits"
                          : `You have used ${Math.round((subscriptionData.current_usage / subscriptionData.cost_limit) * 100)}% of your credits`
                      ) : "No usage limit set"
                    ) : "Loading usage..."
                    }
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchSubscription()}
                    className="h-6 w-6 p-0 hover:bg-muted"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <div className="text-xs text-muted-foreground">
                    {subscriptionData ? (
                      subscriptionData.current_usage && subscriptionData.cost_limit ? (
                        `${Math.round((subscriptionData.current_usage || 0) * 100).toLocaleString()} / ${Math.round((subscriptionData.cost_limit || 0) * 100).toLocaleString()}`
                      ) : "0 / 0"
                    ) : "Loading..."
                    }
                  </div>
                  {subscriptionData && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Live updates enabled" />
                  )}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: subscriptionData && subscriptionData.current_usage && subscriptionData.cost_limit 
                        ? `${Math.min((subscriptionData.current_usage / subscriptionData.cost_limit) * 100, 100)}%`
                        : '0%'
                    }}
                  />
                </div>
              </div> */}
              
              

              {/* Teams Section */}
              {/* {personalAccount && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground text-sm">
                    Personal Account
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    key={personalAccount.account_id}
                    onClick={() =>
                      handleTeamSelect({
                        name: personalAccount.name,
                        logo: Command,
                        plan: 'Personal',
                        account_id: personalAccount.account_id,
                        slug: personalAccount.slug,
                        personal_account: true,
                      })
                    }
                    className="gap-1 rounded-full cursor-pointer"
                  >
                      {/* <DynamicIcon
                        lightPath="/icons/user.svg"
                        darkPath="/icons/user-dark.svg"
                        alt="user"
                        width={20}
                        height={20}
                        className="mb-0 mr-1"
                      /> 
                    {personalAccount.name}                    
                  </DropdownMenuItem>
                  

                

              {/* {teamAccounts?.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground text-xs mt-2">
                    Teams
                  </DropdownMenuLabel>
                  {teamAccounts.map((team, index) => (
                    <DropdownMenuItem
                      key={team.account_id}
                      onClick={() =>
                        handleTeamSelect({
                          name: team.name,
                          logo: AudioWaveform,
                          plan: 'Team',
                          account_id: team.account_id,
                          slug: team.slug,
                          personal_account: false,
                        })
                      }
                      className="gap-1 p-2 py-1.5 rounded-full cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-xs border p-1">
                        <DynamicIcon
                          lightPath="/icons/team.svg"
                          darkPath="/icons/team-dark.svg"
                          alt="team"
                          width={17}
                          height={17}
                          className="shrink-0"
                        />
                      </div>
                      {team.name}                      
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="gap-2 p-2 py-1.5 rounded-full cursor-pointer"
                  onClick={() => {
                    setShowNewTeamDialog(true);
                  }}
                >
                  <div className="flex items-center justify-center">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add team
                  </div>
                </DropdownMenuItem>
              </DialogTrigger> */}
              <DropdownMenuSeparator />

              {/* User Settings Section */}
              <DropdownMenuGroup>                
                <DropdownMenuItem 
                  className="rounded-full cursor-pointer"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-full cursor-pointer"
                  onClick={() => setShowBillingModal(true)}
                >
                  <SubscriptionIcon className="h-4 w-4 mr-2" />
                  Manage Subscription
                </DropdownMenuItem>
                {!flagLoading && customAgentsEnabled && (
                  <DropdownMenuItem asChild className="rounded-full cursor-pointer">
                    {/* <Link href="/settings/credentials">
                      <DynamicIcon
                        lightPath="/icons/integrations.svg"
                        darkPath="/icons/integration-dark.svg"
                        alt="integration"
                        width={17}
                        height={17}
                        className="mb-0"
                      />
                      Integrations
                    </Link> */}
                  </DropdownMenuItem>
                )}

              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-red-500/10 rounded-full cursor-pointer"
                onClick={handleLogout}
              >
                {/* <LogoutIcon className="h-4 w-4 text-red-500" /> */}
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
        <DialogContent className="sm:max-w-[425px] border-subtle dark:border-white/10 bg-card-bg dark:bg-background-secondary rounded-2xl shadow-custom">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Create a new team
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              Create a team to collaborate with others.
            </DialogDescription>
          </DialogHeader>
          <NewTeamForm />
        </DialogContent>
      </Dialog>

      {/* Billing Modal */}
      <BillingModal 
        open={showBillingModal} 
        onOpenChange={setShowBillingModal}
        returnUrl={typeof window !== 'undefined' ? window.location.href : '/'}
      />

      {/* Settings Modal */}
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal}
      />
    </>
  );
}
