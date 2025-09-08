import React from 'react';
import {
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Computer
} from 'lucide-react';
import { ToolViewProps } from '../types';
import {
  formatTimestamp,
} from '../utils';
import { extractExposePortData } from './_utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from '../shared/LoadingState';

export function ExposePortToolView({
  assistantContent,
  toolContent,
  isSuccess = true,
  isStreaming = false,
  assistantTimestamp,
  toolTimestamp,
  project,
}: ToolViewProps) {

  const {
    port,
    url,
    message,
    actualIsSuccess,
    actualToolTimestamp
  } = extractExposePortData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );
  
  // Permanent Daytona preview URL (8080) saved on the project sandbox
  const permanentUrl = project?.sandbox?.sandbox_url || null;

  // Ensure permanent URL points to the correct app path (e.g., /daytona_coffee/index.html)
  const permanentPreviewUrl = React.useMemo(() => {
    if (!permanentUrl) return null;
    try {
      const base = new URL(permanentUrl);

      // Heuristic: try to extract a '/<folder>/index.html' path from assistant/tool content
      const contentStr = [assistantContent, toolContent]
        .filter(Boolean)
        .map((c) => (typeof c === 'string' ? c : JSON.stringify(c)))
        .join('\n');

      // 1) Prefer full URL match and extract its path ending with /index.html
      const fullUrlMatch = contentStr.match(/https?:\/\/[^\s"']+\/(.+?\/index\.html)/);
      if (fullUrlMatch && fullUrlMatch[1]) {
        base.pathname = `/${fullUrlMatch[1]}`;
        return base.toString();
      }

      // 2) Fallback: direct path like /folder/index.html or /a/b/index.html
      const pathMatch = contentStr.match(/\/[A-Za-z0-9_\-\/]+\/index\.html/);
      if (pathMatch && pathMatch[0]) {
        base.pathname = pathMatch[0];
        return base.toString();
      }

      // 3) Fallback: search in thread messages for a browser-like link path
      if (Array.isArray((arguments as any))) {}
      const allMsgText = Array.isArray((arguments as any)) ? '' : '';
      const messagesBlob = Array.isArray((arguments as any)) ? '' : '';
      const msgs = (typeof (arguments as any) === 'undefined' ? [] : []); // no-op guards
      const threadText = Array.isArray((msgs as any))
        ? (msgs as any[])
            .map((m) => (typeof m?.content === 'string' ? m.content : JSON.stringify(m?.content || '')))
            .join('\n')
        : '';

      const msgFullUrlMatch = threadText.match(/https?:\/\/[^\s"']+\/(.+?\/index\.html)/);
      if (msgFullUrlMatch && msgFullUrlMatch[1]) {
        base.pathname = `/${msgFullUrlMatch[1]}`;
        return base.toString();
      }

      // 4) Heuristic: if content references a known app folder name, use it
      const folderMatch = contentStr.match(/\/(?:[A-Za-z0-9_-]+)\//);
      if (folderMatch && folderMatch[0]) {
        const folder = folderMatch[0].replace(/\//g, '');
        if (folder && folder !== 'index') {
          base.pathname = `/${folder}/index.html`;
          return base.toString();
        }
      }

      // Default: if no path, force /index.html
      if (!base.pathname || base.pathname === '/') {
        base.pathname = '/index.html';
      }
      return base.toString();
    } catch {
      return permanentUrl;
    }
  }, [permanentUrl, assistantContent, toolContent]);

  // Classify provided tool URL by detected port
  const isPortInUrl = (u: string | null | undefined, p: number): boolean => {
    if (!u) return false;
    try {
      // Daytona uses subdomain like 8000-<uuid>.proxy..., also support :8000 forms
      return u.includes(`://${p}-`) || new URL(u).port === String(p) || u.includes(`:${p}/`);
    } catch {
      return u.includes(`://${p}-`) || u.includes(`:${p}/`);
    }
  };

  const temporaryUrl = isPortInUrl(url, 8000) ? url : null;
  // If the tool returned an 8080 URL, treat it as permanent too
  const permanentFromTool = isPortInUrl(url, 8080) ? url : null;
  const effectivePermanentUrl = permanentFromTool || permanentPreviewUrl;

  return (
    <Card className="gap-0 flex border shadow-none p-0 rounded-lg flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-9 bg-gradient-to-t from-zinc-50/80 to-zinc-200/70 dark:from-zinc-900/90 dark:to-zinc-800/90 text-center backdrop-blur-lg border-b p-2 px-4 space-y-2 rounded-t-lg">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center w-full justify-center gap-1">
            <Computer className="w-4 h-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Port Exposure
              </CardTitle>
            </div>
          </div>

          {/* {!isStreaming && (
            <Badge
              variant="secondary"
              className={
                actualIsSuccess
                  ? "bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300"
                  : "bg-gradient-to-b from-rose-200 to-rose-100 text-rose-700 dark:from-rose-800/50 dark:to-rose-900/60 dark:text-rose-300"
              }
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              )}
              {actualIsSuccess ? 'Port exposed successfully' : 'Failed to expose port'}
            </Badge>
          )} */}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative bg-transparent shadow-none">
        {isStreaming ? (
          <LoadingState
            icon={Computer}
            iconColor="text-emerald-500 dark:text-emerald-400"
            bgColor="bg-gradient-to-b from-emerald-100 to-emerald-50 shadow-inner dark:from-emerald-800/40 dark:to-emerald-900/60 dark:shadow-emerald-950/20"
            title="Exposing port"
            filePath={port?.toString()}
            showProgress={true}
          />
        ) : (
          <ScrollArea className="h-full w-full">
            <div className=" py-0 space-y-6">
              {(temporaryUrl || effectivePermanentUrl) && (
                <div >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        {effectivePermanentUrl && (
                          <>
                            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                              Preview URL (permanent)
                            </h3>
                            <a
                              href={effectivePermanentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-md font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mb-3 break-all max-w-full"
                            >
                              {effectivePermanentUrl}
                              <ExternalLink className="flex-shrink-0 h-3.5 w-3.5" />
                            </a>
                            {/* Permanent link info message (mirrors temporary style) */}
                            <div className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-md p-3 text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>This preview URL is permanent (serves /index.html) and should remain accessible.</span>
                            </div>
                          </>
                        )}

                        {/* Divider between permanent and temporary links when both exist */}
                        {effectivePermanentUrl && temporaryUrl && (
                          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2" />
                        )}

                        {temporaryUrl && (
                          <>
                            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                              Exposed URL (temporary)
                            </h3>
                            <a
                              href={temporaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-md font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mb-3 break-all max-w-full"
                            >
                              {temporaryUrl}
                              <ExternalLink className="flex-shrink-0 h-3.5 w-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">

                      {/* Removed verbose success message under Port Details per request */}

                      {temporaryUrl && (
                        <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-md p-3 text-amber-600 dark:text-amber-400 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>This exposed URL might be temporary and could expire.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!port && !url && !isStreaming && (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
                    <Computer className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
                    No Port Information
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
                    No port exposure information is available yet. Use the expose-port command to share a local port.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <div className="px-4 py-2 h-10 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {!isStreaming && port && (
            <Badge variant="outline">
              <Computer className="h-3 w-3 mr-1" />
              Port {port}
            </Badge>
          )}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {actualToolTimestamp && formatTimestamp(actualToolTimestamp)}
        </div>
      </div>
    </Card>
  );
}