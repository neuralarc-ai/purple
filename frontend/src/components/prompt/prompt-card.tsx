'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Copy, CheckCircle, Star, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PromptCardProps {
  prompt: {
    id: number;
    content: string;
    industry: string;
    description: string;
  };
  isFavorite: boolean;
  onCopy: (text: string, id: number, prompt?: any) => void;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
  onCardClick?: (prompt: any) => void;
  copiedId: number | null;
  hideCopyButton?: boolean;
}

export function PromptCard({ prompt, isFavorite, onCopy, onToggleFavorite, onCardClick, copiedId, hideCopyButton = false }: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      setIsOverflowing(scrollHeight > clientHeight);
    }
  }, [prompt.content]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or icons
    if ((e.target as HTMLElement).closest('button, a, svg')) {
      return;
    }
    
    if (onCardClick) {
      onCardClick(prompt);
    } else {
      // Try to send the prompt back to the opener window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'PROMPT_SELECTED', content: prompt.content },
          window.location.origin
        );
      } else {
        // Fallback to localStorage
        localStorage.setItem('selectedPrompt', prompt.content);
      }
      
      // Close the prompt library
      window.close();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card 
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full ${
          onCardClick ? 'hover:bg-accent/5' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-sm text-muted-foreground line-clamp-1">{prompt.industry}</h3>
          <div className="flex items-center gap-1">
            {!hideCopyButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(prompt.content, prompt.id, prompt);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Copy to clipboard"
              >
                {copiedId === prompt.id ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(prompt.id, e);
              }}
            >
              <Star
                className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-500' : ''}`}
                fill={isFavorite ? 'currentColor' : 'none'}
              />
            </Button>
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <p
            ref={contentRef}
            className={`text-sm text-foreground whitespace-pre-line flex-grow ${
              isExpanded ? '' : 'line-clamp-4'
            }`}
            style={{ minHeight: '6rem' }}
          >
            {prompt.content}
          </p>
          {isOverflowing && !isExpanded && (
            <div className="mt-2">
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              >
                Show more
              </button>
            </div>
          )}
          {isExpanded && (
            <div className="mt-2">
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
              >
                Show less
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
