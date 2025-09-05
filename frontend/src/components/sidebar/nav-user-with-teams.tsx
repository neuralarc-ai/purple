'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Command,  
  AudioWaveform,
  SquarePen,
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
import { Input } from '@/components/ui/input';
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
  const [showEditNameDialog, setShowEditNameDialog] = React.useState(false);
  const [showBillingModal, setShowBillingModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [editName, setEditName] = React.useState(user.name);
  
  // Update editName when preferredName changes
  React.useEffect(() => {
    if (preferredName && !profileLoading) {
      setEditName(preferredName);
    }
  }, [preferredName, profileLoading]);
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

  // Handle name editing
  const handleEditName = async () => {
    const currentName = preferredName || user.name;
    if (!editName.trim() || editName === currentName) {
      setShowEditNameDialog(false);
      return;
    }
    
    setEditLoading(true);
    try {
      const supabase = createClient();
      
      // Update the user profile with the new preferred name
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user-profiles/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferred_name: editName.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      // Invalidate the user profile query to refresh the data
      // This will trigger a refetch and update the UI
      toast.success('Preferred name updated successfully!');
      setShowEditNameDialog(false);
      
      // Force a refetch of the user profile
      window.location.reload();
    } catch (err) {
      console.error('Error updating preferred name:', err);
      toast.error('Failed to update preferred name. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

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
                    <div className="flex items-center gap-2 group">
                      <span className="truncate font-medium">
                        {profileLoading ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          preferredName || user.name
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditName(preferredName || user.name);
                          setShowEditNameDialog(true);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                        aria-label="Edit name"
                      >
                        <SquarePen className="h-3 w-3" />
                      </button>
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
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-full cursor-pointer"
                  onClick={() => setShowBillingModal(true)}
                >
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

      {/* Edit Name Dialog */}
      <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
        <DialogContent className="sm:max-w-[400px] bg-background border border-border rounded-lg shadow-lg p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Edit Preferred Name
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your preferred name"
              disabled={editLoading}
              autoFocus
              className="mb-4"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleEditName} 
                disabled={editLoading || !editName.trim() || editName === (preferredName || user.name)}
                size="sm"
              >
                {editLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
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
