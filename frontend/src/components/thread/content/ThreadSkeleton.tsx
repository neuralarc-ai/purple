import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInput } from '@/components/thread/chat-input/chat-input';
import { cn } from '@/lib/utils';

interface ThreadSkeletonProps {
    isSidePanelOpen?: boolean;
    showHeader?: boolean;
    messageCount?: number;
}

export function ThreadSkeleton({
    isSidePanelOpen = false,
    showHeader = true,
    messageCount = 3,
}: ThreadSkeletonProps) {
    return (
        <div className="flex h-screen">
            <div
                className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ease-in-out ${
                    isSidePanelOpen ? 'mr-[45vw]' : ''
                }`}
            >
                {/* Skeleton Header */}
                {showHeader && (
                    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-14 items-center gap-4 px-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Skeleton Chat Messages */}
                <div className="flex-1 overflow-y-auto py-4 pb-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto min-w-0 w-full max-w-4xl px-4 md:px-6 lg:px-12">
                        <div className="space-y-8 min-w-0">
                            {/* Generate multiple message skeletons based on messageCount */}
                            {Array.from({ length: messageCount }).map((_, index) => (
                                <React.Fragment key={index}>
                                    {/* User message - every other message */}
                                    {index % 2 === 0 ? (
                                        <div className="space-y-3">
                                            {/* File attachments skeleton */}
                                            <div className="w-full">
                                                <Skeleton className="h-20 w-full rounded-md" />
                                            </div>
                                            
                                            <div className="flex justify-end">
                                                <div className="flex max-w-[85%] rounded-2xl rounded-br-sm bg-sidebar dark:bg-sidebar border px-4 py-3 pb-2">
                                                    <div className="space-y-3 min-w-0 flex-1">
                                                        <Skeleton className="h-4 w-48" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Assistant response with tool usage */
                                        <div>
                                            <div className="flex max-w-[90%] text-sm xl:text-base">
                                                <div className="space-y-2 min-w-0 flex-1">
                                                    <div className="prose prose-sm dark:prose-invert chat-markdown max-w-none">
                                                        <div className="space-y-3">
                                                            <Skeleton className="h-4 w-full max-w-[360px] mb-2" />
                                                            <Skeleton className="h-4 w-full max-w-[320px] mb-2" />
                                                            <Skeleton className="h-4 w-full max-w-[290px]" />
                                                        </div>

                                                        {/* Tool call button skeleton */}
                                                        {index % 3 === 1 && (
                                                            <div className="my-1">
                                                                <Skeleton className="h-6 w-32 rounded-lg" />
                                                            </div>
                                                        )}

                                                        {index % 3 === 1 && (
                                                            <div>
                                                                <Skeleton className="h-4 w-full max-w-[340px] mb-2" />
                                                                <Skeleton className="h-4 w-full max-w-[280px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Agent info and action buttons skeleton */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <Skeleton className="h-5 w-5 rounded-md" />
                                                            <Skeleton className="h-4 w-20 ml-1.5" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="h-6 w-6 rounded-sm" />
                                                            <Skeleton className="h-6 w-6 rounded-sm" />
                                                            <Skeleton className="h-6 w-6 rounded-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Assistant thinking state */}
                            <div>
                                <div className="flex max-w-[90%] text-sm xl:text-base">
                                    <div className="space-y-2 min-w-0 flex-1">
                                        <div className="mt-4 overflow-visible pb-8 flex ml-2">
                                            <div className="flex items-center gap-1.5 py-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse delay-150" />
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse delay-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer text skeleton */}
                <div className="px-4 text-center">
                    <div className="max-w-[100vw] overflow-x-auto whitespace-nowrap">
                        <Skeleton className="h-4 w-64 mx-auto rounded-lg" />
                    </div>
                </div>

                {/* ChatInput - Positioned at bottom with exact same styling as actual layout */}
                <div
                    className={cn(
                        "fixed bottom-6 mx-6 z-20 bg-gradient-to-t from-background via-background/90 to-transparent pt-6",
                        "transition-[left,right] duration-200 ease-in-out will-change-[left,right]",
                        "left-[53px] right-[45vw]"
                    )}
                >
                    <div className="flex justify-center px-0">
                        <div className="w-full max-w-4xl">
                            <ChatInput
                                onSubmit={() => {}}
                                onChange={() => {}}
                                placeholder="Describe what you need help with..."
                                loading={false}
                                disabled={true}
                                isAgentRunning={false}
                                value=""
                                hideAttachments={false}
                                isLoggedIn={true}
                                hideAgentSelection={true}
                                defaultShowSnackbar={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Panel - Always visible in skeleton with 45% width */}
            <div className="hidden sm:block">
                <div className="h-screen w-[45vw] border-l">
                    <div className="p-4">
                        <Skeleton className="h-8 w-32 mb-4" />
                        <Skeleton className="h-20 w-full rounded-md mb-4" />
                        <Skeleton className="h-40 w-full rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}