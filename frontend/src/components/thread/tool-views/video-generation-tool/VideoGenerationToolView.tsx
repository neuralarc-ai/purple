'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileAttachment } from '../../file-attachment';
import { Project } from '@/lib/api';
import { FileVideo, Clock, Settings } from 'lucide-react';

interface VideoGenerationToolViewProps {
  name?: string;
  assistantContent?: string;
  toolContent?: string;
  assistantTimestamp?: string;
  toolTimestamp?: string;
  isSuccess?: boolean;
  isStreaming?: boolean;
  onFileClick?: (filePath: string) => void;
  project?: Project;
}

export function VideoGenerationToolView({
  name = 'generate_video',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  onFileClick,
  project,
}: VideoGenerationToolViewProps) {
  
  // Parse tool content to extract parameters
  const parseToolContent = () => {
    try {
      if (!toolContent) return null;
      
      // Try to parse as JSON first
      try {
        return JSON.parse(toolContent);
      } catch {
        // If not JSON, try to extract from text format
        const lines = toolContent.split('\n');
        const params: any = {};
        
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':', 2);
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            const cleanValue = value.trim();
            
            if (cleanKey && cleanValue) {
              params[cleanKey] = cleanValue;
            }
          }
        });
        
        return Object.keys(params).length > 0 ? params : null;
      }
    } catch (error) {
      console.error('Error parsing tool content:', error);
      return null;
    }
  };

  const toolParams = parseToolContent();
  
  // Extract video file path from assistant content
  const extractVideoPath = () => {
    if (!assistantContent) return null;
    
    // Look for patterns like "generated_video_abc123.mp4" or "Video saved as: filename.mp4"
    const videoMatch = assistantContent.match(/(?:Video saved as:|generated_video_)[\w\-\.]+\.mp4/g);
    if (videoMatch && videoMatch.length > 0) {
      // Extract just the filename from the match
      const filename = videoMatch[0].replace(/.*(generated_video_[\w\-\.]+\.mp4).*/, '$1');
      return filename;
    }
    
    return null;
  };

  const videoPath = extractVideoPath();

  const handleFileClick = (filePath: string) => {
    if (onFileClick) {
      onFileClick(filePath);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tool Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <FileVideo className="h-4 w-4 text-helium-blue" />
          <span className="font-medium text-sm">Video Generation</span>
        </div>
        {isSuccess && (
          <Badge variant="secondary" className="text-xs">
            Success
          </Badge>
        )}
        {isStreaming && (
          <Badge variant="outline" className="text-xs animate-pulse">
            Generating...
          </Badge>
        )}
      </div>

      {/* Tool Parameters */}
      {toolParams && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Generation Parameters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {toolParams.prompt && (
                <div>
                  <span className="text-muted-foreground">Prompt:</span>
                  <p className="mt-1 p-2 bg-background rounded border text-xs">
                    {toolParams.prompt}
                  </p>
                </div>
              )}
              
              {toolParams.image_path && (
                <div>
                  <span className="text-muted-foreground">Source Image:</span>
                  <p className="mt-1 font-mono text-xs">{toolParams.image_path}</p>
                </div>
              )}
              
              {toolParams.aspect_ratio && (
                <div>
                  <span className="text-muted-foreground">Aspect Ratio:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {toolParams.aspect_ratio}
                  </Badge>
                </div>
              )}
              
              {toolParams.resolution && (
                <div>
                  <span className="text-muted-foreground">Resolution:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {toolParams.resolution}
                  </Badge>
                </div>
              )}
              
              {toolParams.person_generation && (
                <div>
                  <span className="text-muted-foreground">Person Generation:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {toolParams.person_generation}
                  </Badge>
                </div>
              )}
              
              {toolParams.negative_prompt && (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">Negative Prompt:</span>
                  <p className="mt-1 p-2 bg-background rounded border text-xs">
                    {toolParams.negative_prompt}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Video */}
      {videoPath && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Generated Video</span>
            <Badge variant="secondary" className="text-xs">
              8 seconds
            </Badge>
          </div>
          
          <div className="relative">
            <FileAttachment
              filepath={videoPath}
              onClick={handleFileClick}
              sandboxId={project?.sandbox?.id}
              showPreview={true}
              className="w-full aspect-video"
              customStyle={{
                width: '100%',
                height: '100%',
                '--attachment-height': '100%'
              } as React.CSSProperties}
              collapsed={false}
              project={project}
              displayMode="grid"
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {assistantContent && !videoPath && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {assistantContent}
          </p>
        </div>
      )}

      {/* Error State */}
      {!isSuccess && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            Video generation failed. Please check the parameters and try again.
          </p>
        </div>
      )}
    </div>
  );
}
