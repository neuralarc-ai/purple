# Real-Time Credits Usage Solution

## Problem Description

The thread details and navigation bar were not showing real-time credits usage updates. Users had to manually refresh the page to see current credit consumption, which provided a poor user experience.

### Specific Issues
1. **Thread Details**: Credits only updated on page refresh (every 5+ minutes)
2. **Navigation Bar**: Total token usage in sidebar only updated after manual refresh
3. **No Real-Time Updates**: Both components showed outdated information

## Root Cause

1. **No Real-Time Subscriptions**: The application wasn't subscribed to real-time updates from the `usage_logs` and `credit_usage` tables
2. **Long Stale Time**: React Query had a 5-10 minute stale time, meaning data was only refreshed every 5-10 minutes
3. **No Agent Status Awareness**: The credits display didn't know when the agent was running to provide more frequent updates
4. **Subscription Hook Limitations**: The main subscription hook had very long stale times (10 minutes)

## Solution Implemented

### 1. Real-Time Supabase Subscriptions

Created `useUsageRealtime` hook that subscribes to:
- `usage_logs` table changes for the current user
- `credit_usage` table changes for the current user

When changes occur, it automatically invalidates React Query cache for:
- Usage logs
- Thread token usage
- Subscription data

### 2. Enhanced Thread Token Usage Hook

Updated `useThreadTokenUsage` to:
- Accept `agentStatus` parameter
- Use shorter stale times when agent is running (5s vs 10s)
- Use shorter refetch intervals when agent is running (10s vs 30s)
- Always refetch on mount and window focus

### 3. Enhanced Subscription Hook

Updated `useSubscription` to:
- Reduce stale time from 10 minutes to 2 minutes
- Add automatic refetch every 2 minutes
- Enable refetch on window focus and mount
- Provide better real-time behavior

### 4. Real-Time Integration

- Added real-time subscriptions to thread page and thread header
- Added real-time subscriptions to main dashboard layout
- Added real-time subscriptions to dashboard content page
- Pass `agentStatus` from thread layout to thread header
- Enable real-time updates when user is authenticated

### 5. User Experience Improvements

#### Thread Header
- Added refresh button for manual updates
- Visual indicator (green pulsing dot) when live updates are enabled
- Tooltips explaining real-time features
- Last updated timestamp display
- Auto-update frequency indicator

#### Navigation Bar
- Added refresh button for manual updates
- Live indicator with green pulsing dot
- Last updated timestamp
- Auto-update frequency display (every 2 minutes)
- Real-time updates across all dashboard pages

## Files Modified

### New Files
- `frontend/src/hooks/useUsageRealtime.ts` - Real-time subscription hook

### Modified Files
- `frontend/src/hooks/react-query/threads/use-thread-token-usage.ts` - Enhanced with agent status awareness
- `frontend/src/hooks/react-query/subscriptions/use-subscriptions.ts` - Reduced stale time and added auto-refetch
- `frontend/src/components/thread/thread-site-header.tsx` - Added real-time features and UI improvements
- `frontend/src/app/(dashboard)/projects/[projectId]/thread/_components/ThreadLayout.tsx` - Pass agent status to header
- `frontend/src/app/(dashboard)/projects/[projectId]/thread/[threadId]/page.tsx` - Added real-time hook
- `frontend/src/components/sidebar/nav-user-with-teams.tsx` - Added real-time features and UI improvements
- `frontend/src/components/dashboard/layout-content.tsx` - Added real-time hook for all dashboard pages

## How It Works

1. **When User Opens Dashboard**: Real-time subscriptions are established for their user ID across all dashboard pages
2. **During Agent Execution**: Thread credits update every 10 seconds automatically
3. **When Agent Idle**: Thread credits update every 30 seconds as fallback
4. **Navigation Bar**: Updates every 2 minutes automatically + real-time database events
5. **Real-Time Events**: Any database changes immediately trigger cache invalidation
6. **Manual Refresh**: Users can manually refresh both thread and navigation bar if needed

## Testing the Solution

### 1. Check Console Logs

Open browser console and look for:
```
[useUsageRealtime] Setting up real-time subscriptions for user: [user-id]
[useUsageRealtime] Usage logs subscription status: SUBSCRIBED
[useUsageRealtime] Credit usage subscription status: SUBSCRIBED
[useThreadTokenUsage] Hook config for thread [thread-id]: { agentStatus: 'idle', staleTime: '10s', refetchInterval: '30s' }
```

### 2. Test Thread Real-Time Updates

1. Open a thread and note the current credits
2. Start an agent (credits should update every 10 seconds)
3. Stop the agent (credits should update every 30 seconds)
4. Check for green pulsing dot when agent is running

### 3. Test Navigation Bar Real-Time Updates

1. Open navigation bar and note current credits
2. Use agent in another tab/window
3. Check navigation bar updates automatically (every 2 minutes)
4. Use refresh button for immediate updates
5. Look for "Live" indicator with green dot

### 4. Test Manual Refresh

1. Click refresh buttons in both thread header and navigation bar
2. Verify credits update immediately
3. Check console for invalidation logs

### 5. Test Database Changes

1. Have another user or process update usage data
2. Verify credits update automatically without refresh
3. Check console for real-time event logs

## Expected Behavior

### Before
- **Thread Credits**: Only updated on page refresh (every 5+ minutes)
- **Navigation Bar**: Only updated on page refresh (every 5+ minutes)
- **User Experience**: Poor, required manual refresh

### After
- **Thread Credits**: Update automatically every 10-30 seconds + real-time database events
- **Navigation Bar**: Update automatically every 2 minutes + real-time database events
- **Visual Indicators**: Green dots and "Live" labels when updates are active
- **Performance**: Minimal overhead, only active when user is viewing dashboard/threads

## Troubleshooting

### Real-Time Not Working
1. Check browser console for subscription errors
2. Verify user is authenticated
3. Check Supabase real-time is enabled
4. Verify network connectivity

### Credits Not Updating
1. Check React Query cache invalidation
2. Verify hook is receiving agent status (for thread)
3. Check for API errors in console
3. Verify usage logs endpoint is working

### Performance Issues
1. Check refetch intervals aren't too aggressive
2. Verify cleanup on component unmount
3. Check for memory leaks in subscriptions
4. Monitor React Query cache size

## Future Enhancements

1. **WebSocket Fallback**: Add WebSocket support for better real-time performance
2. **Debounced Updates**: Prevent excessive updates during rapid changes
3. **Offline Support**: Cache updates when offline, sync when reconnected
4. **User Preferences**: Allow users to configure update frequency
5. **Batch Updates**: Group multiple changes into single updates
6. **Smart Refetching**: Adjust update frequency based on user activity
7. **Cross-Tab Updates**: Sync updates across multiple browser tabs
