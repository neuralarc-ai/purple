import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Zap,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  Server,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useComposioCategories,
  useComposioToolkitsInfinite,
} from '@/hooks/react-query/composio/use-composio';
import { useComposioProfiles } from '@/hooks/react-query/composio/use-composio-profiles';
import { useAgent, useUpdateAgent } from '@/hooks/react-query/agents/use-agents';
import { ComposioConnector } from './composio-connector';
import { ComposioToolsManager } from './composio-tools-manager';
import type { ComposioToolkit, ComposioProfile } from '@/hooks/react-query/composio/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CustomMCPDialog } from '../mcp/custom-mcp-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDeleteProfile } from '@/hooks/react-query/composio/use-composio-mutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CATEGORY_EMOJIS: Record<string, string> = {
  popular: '🔥',
  productivity: '📊',
  crm: '👥',
  marketing: '📢',
  analytics: '📈',
  communication: '💬',
  'project-management': '📋',
  scheduling: '📅',
  'Design & creative tools': '🎨',
};

const PAGE_SIZE = 10;

interface ConnectedApp {
  toolkit: ComposioToolkit;
  profile: ComposioProfile;
  mcpConfig: {
    name: string;
    type: string;
    config: Record<string, any>;
    enabledTools: string[];
  };
}

interface ComposioRegistryProps {
  onToolsSelected?: (
    profileId: string,
    selectedTools: string[],
    appName: string,
    appSlug: string
  ) => void;
  onAppSelected?: (app: ComposioToolkit) => void;
  mode?: 'full' | 'profile-only';
  onClose?: () => void;
  showAgentSelector?: boolean;
  selectedAgentId?: string;
  onAgentChange?: (agentId: string | undefined) => void;
}

const getAgentConnectedApps = (
  agent: any,
  profiles: ComposioProfile[],
  toolkits: ComposioToolkit[]
): ConnectedApp[] => {
  if (!agent?.custom_mcps || !toolkits?.length) return [];

  const connectedApps: ConnectedApp[] = [];

  agent.custom_mcps.forEach((mcpConfig: any) => {
    if (mcpConfig.config?.profile_id) {
      const profile = profiles?.find((p) => p.profile_id === mcpConfig.config.profile_id);
      const toolkit = toolkits.find((t) => t.slug === profile?.toolkit_slug);
      if (profile && toolkit) {
        connectedApps.push({
          toolkit,
          profile,
          mcpConfig,
        });
      }
    } else if (mcpConfig.name && mcpConfig.type === 'http') {
      const toolkit: ComposioToolkit = {
        slug: mcpConfig.name.toLowerCase().replace(/\s+/g, '-'),
        name: mcpConfig.name,
        description: `Custom integration with ${mcpConfig.name}`,
        logo: '',
        tags: ['custom', 'http'],
        categories: ['custom'],
        auth_schemes: [],
      };

      if (!connectedApps.some((app) => app.toolkit.name.toLowerCase() === toolkit.name.toLowerCase())) {
        const now = new Date().toISOString();
        connectedApps.push({
          toolkit,
          profile: {
            profile_id: `custom-${toolkit.slug}-${Date.now()}`,
            profile_name: mcpConfig.name,
            display_name: mcpConfig.name,
            toolkit_slug: toolkit.slug,
            toolkit_name: toolkit.name,
            mcp_url: '',
            is_connected: true,
            is_default: false,
            created_at: now,
            config: {},
          },
          mcpConfig,
        });
      }
    }
  });

  return connectedApps;
};

const isAppConnectedToAgent = (
  agent: any,
  appSlug: string,
  profiles: ComposioProfile[]
): boolean => {
  if (!agent?.custom_mcps) return false;

  return agent.custom_mcps.some((mcpConfig: any) => {
    if (mcpConfig.config?.profile_id) {
      const profile = profiles.find((p) => p.profile_id === mcpConfig.config.profile_id);
      return profile?.toolkit_slug === appSlug;
    }
    return false;
  });
};

const AppCardSkeleton = () => (
  <div className="border border-border/50 rounded-xl p-4 h-full flex flex-col">
    <div className="flex flex-col items-center text-center mb-3">
      <Skeleton className="w-12 h-12 rounded-lg mb-3" />
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-full h-3 mb-2" />
      <Skeleton className="w-1/2 h-3" />
    </div>
    <div className="mt-auto pt-3 border-t">
      <Skeleton className="w-24 h-4 mx-auto" />
    </div>
  </div>
);

const ConnectedAppSkeleton = () => (
  <div className="border border-border/50 rounded-xl p-4 h-full flex flex-col">
    <div className="flex flex-col items-center text-center mb-3">
      <Skeleton className="w-12 h-12 rounded-lg mb-3" />
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-full h-3 mb-2" />
      <Skeleton className="w-1/2 h-3" />
    </div>
    <div className="mt-auto pt-3 border-t">
      <Skeleton className="w-24 h-4 mx-auto" />
    </div>
  </div>
);

const ConnectedAppCard = ({
  connectedApp,
  onManageTools,
  onDelete,
  isUpdating,
}: {
  connectedApp: ConnectedApp;
  onManageTools: (connectedApp: ConnectedApp) => void;
  onDelete: (profileId: string) => Promise<void>;
  isUpdating: boolean;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDelete(connectedApp.profile.profile_id);
      setShowDeleteDialog(false);
      toast.success('Profile deleted successfully');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      toast.error('Failed to delete profile');
    } finally {
      setIsDeleting(false);
    }
  };

  const { toolkit, profile, mcpConfig } = connectedApp;
  const hasEnabledTools = mcpConfig.enabledTools && mcpConfig.enabledTools.length > 0;
  const toolsCount = mcpConfig.enabledTools?.length || 0;

  return (
    <div className="relative group">
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted/50"
          onClick={(e) => {
            e.stopPropagation();
            onManageTools(connectedApp);
          }}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="sr-only">Manage tools</span>
        </Button>
      </div>
      <div
        className="border border-border rounded-xl p-4 transition-all h-full flex flex-col"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 relative">
            {toolkit.logo ? (
              <>
                <img
                  src={toolkit.logo}
                  alt={toolkit.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <span className="text-lg hidden absolute">
                  {toolkit.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </span>
              </>
            ) : (
              <span className="text-lg">
                {toolkit.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </span>
            )}
          </div>
          <h3 className="font-medium text-sm mb-1">{toolkit.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            Connected as "{profile.profile_name}"
          </p>
        </div>
        
        <div className="mt-auto pt-3 border-t">
          {hasEnabledTools ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{toolsCount} {toolsCount === 1 ? 'tool' : 'tools'} enabled</span>
              </div>
              {mcpConfig.type === 'http' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        <span>Custom MCP</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Custom MCP Integration</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>No tools enabled</span>
              </div>
              {mcpConfig.type === 'http' && (
                <span className="text-xs text-muted-foreground">Custom MCP</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteDialog(true);
        }}
        disabled={isUpdating || isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {showDeleteDialog && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete the profile for {toolkit.name}?
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

const AppCard = ({
  app,
  profiles,
  onConnect,
  onConfigure,
  isConnectedToAgent,
  currentAgentId,
  mode,
}: {
  app: ComposioToolkit;
  profiles: ComposioProfile[];
  onConnect: () => void;
  onConfigure: (profile: ComposioProfile) => void;
  isConnectedToAgent: boolean;
  currentAgentId?: string;
  mode?: 'full' | 'profile-only';
}) => {
  const connectedProfiles = profiles.filter((p) => p.is_connected);
  const canConnect = mode === 'profile-only' ? true : !isConnectedToAgent && !!currentAgentId;

  const clickHandler = canConnect
    ? connectedProfiles.length > 0
      ? () => onConfigure(connectedProfiles[0])
      : onConnect
    : undefined;

  return (
    <div
      onClick={clickHandler}
      className={cn(
        'border border-border rounded-xl p-4 transition-all cursor-pointer hover:border-primary/50 hover:shadow-md h-full flex flex-col',
        !clickHandler && 'opacity-60 cursor-not-allowed',
        isConnectedToAgent && 'border-green-500/30 bg-green-50 dark:bg-green-900/10'
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 relative">
          {app.logo ? (
            <>
              <img
                src={app.logo}
                alt={app.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <span className="text-lg absolute hidden">
                {app.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </span>
            </>
          ) : (
            <span className="text-lg">
              {app.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
          )}
        </div>
        <h3 className="font-medium text-sm mb-1">{app.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {app.description || 'No description available'}
        </p>
      </div>
      
      <div className="mt-auto pt-3 border-t">
        {isConnectedToAgent ? (
          <div className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Connected</span>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Connected to this agent
            </div>
          </div>
        ) : connectedProfiles.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Profile available ({connectedProfiles.length})
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Not connected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ComposioRegistry: React.FC<ComposioRegistryProps> = ({
  onToolsSelected,
  onAppSelected,
  mode = 'full',
  onClose,
  showAgentSelector = false,
  selectedAgentId,
  onAgentChange,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<ComposioToolkit | null>(null);
  const [showConnector, setShowConnector] = useState(false);
  const [showConnectedApps, setShowConnectedApps] = useState(true);
  const [showToolsManager, setShowToolsManager] = useState(false);
  const [selectedConnectedApp, setSelectedConnectedApp] = useState<ConnectedApp | null>(null);
  const [showCustomMCPDialog, setShowCustomMCPDialog] = useState(false);

  // pagination state
  const [page, setPage] = useState(1);

  const [internalSelectedAgentId, setInternalSelectedAgentId] = useState<string | undefined>(
    selectedAgentId
  );
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading: isLoadingCategories } = useComposioCategories();
  const {
    data: toolkitsInfiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
  } = useComposioToolkitsInfinite(search, selectedCategory);
  const { data: profiles, isLoading: isLoadingProfiles } = useComposioProfiles();

  const allToolkits = useMemo(() => {
    if (!toolkitsInfiniteData?.pages) return [] as ComposioToolkit[];
    return toolkitsInfiniteData.pages.flatMap((page) => page.toolkits || []);
  }, [toolkitsInfiniteData]);

  // Reset pagination on search/category change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  // If user clicks next beyond loaded results, fetch the next page transparently
  useEffect(() => {
    const endIndex = page * PAGE_SIZE;
    if (endIndex > allToolkits.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [page, allToolkits.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentAgentId = selectedAgentId ?? internalSelectedAgentId;
  const { data: agent, isLoading: isLoadingAgent } = useAgent(currentAgentId || '');
  const { mutate: updateAgent, isPending: isUpdatingAgent } = useUpdateAgent();
  const deleteProfile = useDeleteProfile();

  const handleAgentSelect = (agentId: string | undefined) => {
    if (onAgentChange) onAgentChange(agentId);
    else setInternalSelectedAgentId(agentId);
  };

  const profilesByToolkit = useMemo(() => {
    const grouped: Record<string, ComposioProfile[]> = {};
    profiles?.forEach((profile) => {
      if (profile.is_connected) {
        if (!grouped[profile.toolkit_slug]) grouped[profile.toolkit_slug] = [];
        grouped[profile.toolkit_slug].push(profile);
      }
    });
    return grouped;
  }, [profiles]);

  const connectedApps = useMemo(() => {
    if (!currentAgentId || !agent) return [] as ConnectedApp[];
    return getAgentConnectedApps(agent, profiles || [], allToolkits);
  }, [agent, profiles, allToolkits, currentAgentId]);

  const isLoadingConnectedApps = currentAgentId && (isLoadingAgent || isLoadingProfiles || isLoading);

  // filtering (by search handled server-side via hook) — we still keep the list as-is
  const filteredToolkits = useMemo(() => allToolkits, [allToolkits]);

  // pagination slice
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pagedToolkits = filteredToolkits.slice(startIdx, endIdx);
  const totalLoadedPages = Math.max(1, Math.ceil(filteredToolkits.length / PAGE_SIZE));
  const canGoNext = page < totalLoadedPages || !!hasNextPage;

  const handleConnect = (app: ComposioToolkit) => {
    if (mode !== 'profile-only' && !currentAgentId) {
      toast.error('Please select an agent first');
      return;
    }
    setSelectedApp(app);
    setShowConnector(true);
  };

  const handleConfigure = (app: ComposioToolkit, profile: ComposioProfile) => {
    if (mode !== 'profile-only' && !currentAgentId) {
      toast.error('Please select an agent first');
      return;
    }
    setSelectedApp(app);
    setShowConnector(true);
  };

  const handleManageTools = (connectedApp: ConnectedApp) => {
    setSelectedConnectedApp(connectedApp);
    setShowToolsManager(true);
  };

  const handleConnectionComplete = (profileId: string, appName: string, appSlug: string) => {
    setShowConnector(false);
    queryClient.invalidateQueries({ queryKey: ['composio', 'profiles'] });
    if (currentAgentId) {
      queryClient.invalidateQueries({ queryKey: ['agents', 'detail', currentAgentId] });
    }
    onToolsSelected?.(profileId, [], appName, appSlug);
  };

  const handleCustomMCPSave = async (customConfig: any): Promise<void> => {
    if (!currentAgentId) throw new Error('Please select an agent first');

    const mcpConfig = {
      name: customConfig.name || 'Custom MCP',
      type: customConfig.type || 'sse',
      config: customConfig.config || {},
      enabledTools: customConfig.enabledTools || [],
    };

    const currentCustomMcps = agent?.custom_mcps || [];
    const updatedCustomMcps = [...currentCustomMcps, mcpConfig];

    return new Promise((resolve, reject) => {
      updateAgent(
        { agentId: currentAgentId, custom_mcps: updatedCustomMcps },
        {
          onSuccess: () => {
            toast.success(`Custom MCP "${customConfig.name}" added successfully`);
            queryClient.invalidateQueries({ queryKey: ['agents', 'detail', currentAgentId] });
            resolve();
          },
          onError: (error: any) => reject(new Error(error.message || 'Failed to add custom MCP')),
        }
      );
    });
  };

  const categories = categoriesData?.categories || [];

  return (
    <div className="h-full w-full overflow-hidden flex">
      {/* Sidebar: Categories */}
      <div className="w-64 h-full overflow-hidden border-r bg-muted/20">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-4 border-b">
            <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                    selectedCategory === ''
                      ? 'bg-muted-foreground/20 text-foreground'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="text-base">📁</span>
                  <span>All Apps</span>
                </button>

                {isLoadingCategories ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <Skeleton className="w-4 h-4 bg-muted rounded" />
                        <Skeleton className="flex-1 h-4 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  categoriesData?.categories?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                        selectedCategory === category.id
                          ? 'bg-muted-foreground/20 text-foreground'
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="text-base">{CATEGORY_EMOJIS[category.id] || '📁'}</span>
                      <span className="truncate">{category.name}</span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 h-full overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold">{mode === 'profile-only' ? 'Connect New App' : 'App Integrations'}</h2>
                <p className="text-sm text-muted-foreground">
                  {mode === 'profile-only'
                    ? 'Create a connection profile for your favorite apps'
                    : `Connect your favorite apps with ${currentAgentId && (agent as any)?.name ? (agent as any).name : 'your'} Agent`}
                </p>
              </div>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="ml-4">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </div>

            {/* Search and Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search apps..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {mode !== 'profile-only' && currentAgentId && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomMCPDialog(true)} 
                    className="flex items-center gap-2 whitespace-nowrap h-10"
                  >
                    <Server className="h-4 w-4" />
                    Add Custom MCP
                  </Button>
                )}
              </div>

              {selectedCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filtered by:</span>
                  <Badge variant="outline" className="gap-1 bg-muted-foreground/20 text-muted-foreground">
                    <span>{CATEGORY_EMOJIS[selectedCategory] || '📁'}</span>
                    <span>{categories.find((c: any) => c.id === selectedCategory)?.name}</span>
                    <button onClick={() => setSelectedCategory('')} className="ml-1 hover:bg-muted rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {currentAgentId && (
                  <Collapsible open={showConnectedApps} onOpenChange={setShowConnectedApps}>
                    <CollapsibleTrigger asChild>
                      <div className="w-full hover:underline flex items-center justify-between p-0 h-auto cursor-pointer">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">
                            Connected to {currentAgentId && (agent as any)?.name ? (agent as any).name : 'this agent'} Agent
                          </h3>
                          {isLoadingConnectedApps ? (
                            <Skeleton className="w-6 h-5 rounded ml-2" />
                          ) : connectedApps.length > 0 ? (
                            <Badge variant="outline" className="ml-2">
                              {connectedApps.length}
                            </Badge>
                          ) : null}
                        </div>
                        {showConnectedApps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      {isLoadingConnectedApps ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <ConnectedAppSkeleton key={i} />
                          ))}
                        </div>
                      ) : connectedApps.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 mx-auto">
                            <Zap className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h4 className="text-sm font-medium mb-2">No connected apps</h4>
                          <p className="text-xs">Connect apps below to manage tools for this agent.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {connectedApps.map((connectedApp) => (
                            <ConnectedAppCard
                              key={connectedApp.profile.profile_id}
                              connectedApp={connectedApp}
                              onManageTools={handleManageTools}
                              onDelete={async (profileId) => {
                                await deleteProfile.mutateAsync(profileId);
                                if (selectedAgentId) {
                                  await queryClient.invalidateQueries({ 
                                    queryKey: ['agents', 'detail', selectedAgentId],
                                    exact: true
                                  });
                                }
                              }}
                              isUpdating={isUpdatingAgent}
                            />
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Available Apps */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{currentAgentId ? 'Available Apps' : 'Browse Apps'}</h3>

                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <AppCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : pagedToolkits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No apps found</h3>
                      <p className="text-muted-foreground">
                        {search ? `No apps match "${search}"` : 'No apps available in this category'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pagedToolkits.map((app) => (
                          <AppCard
                            key={app.slug}
                            app={app}
                            profiles={profilesByToolkit[app.slug] || []}
                            onConnect={() => handleConnect(app)}
                            onConfigure={(profile) => handleConfigure(app, profile)}
                            isConnectedToAgent={isAppConnectedToAgent(agent, app.slug, profiles || [])}
                            currentAgentId={currentAgentId}
                            mode={mode}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between pt-6">
                        <div className="text-xs text-muted-foreground">Page {page}</div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!canGoNext}
                          >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {selectedApp && (
        <ComposioConnector
          app={selectedApp}
          agentId={currentAgentId}
          open={showConnector}
          onOpenChange={setShowConnector}
          onComplete={handleConnectionComplete}
          mode={mode}
        />
      )}

      {selectedConnectedApp && currentAgentId && (
        <ComposioToolsManager
          agentId={currentAgentId}
          open={showToolsManager}
          onOpenChange={setShowToolsManager}
          profileId={selectedConnectedApp.profile.profile_id}
          profileInfo={{
            profile_id: selectedConnectedApp.profile.profile_id,
            profile_name: selectedConnectedApp.profile.profile_name,
            toolkit_name: selectedConnectedApp.toolkit.name,
            toolkit_slug: selectedConnectedApp.toolkit.slug,
          }}
          appLogo={selectedConnectedApp.toolkit.logo}
          onToolsUpdate={() => {
            if (currentAgentId) queryClient.invalidateQueries({ queryKey: ['agents', 'detail', currentAgentId] });
          }}
        />
      )}

      <CustomMCPDialog open={showCustomMCPDialog} onOpenChange={setShowCustomMCPDialog} onSave={handleCustomMCPSave} />
    </div>
  );
};
