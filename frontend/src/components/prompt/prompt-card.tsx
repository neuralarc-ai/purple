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
  copiedId: number | null;
}

export function PromptCard({ prompt, isFavorite, onCopy, onToggleFavorite, copiedId }: PromptCardProps) {
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
    
    // Navigate to dashboard with the prompt content
    const params = new URLSearchParams();
    params.set('prompt', encodeURIComponent(prompt.content));
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm text-muted-foreground">
          {prompt.industry} • {prompt.description}
        </h3>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(prompt.id, e);
            }}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(prompt.content, prompt.id, prompt);
            }}
          >
            {copiedId === prompt.id ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="relative">
        <p
          ref={contentRef}
          className={`text-sm text-foreground whitespace-pre-line ${
            isExpanded ? '' : 'line-clamp-4'
          }`}
        >
          {prompt.content}
        </p>
        {isOverflowing && !isExpanded && (
          <button
            className="text-xs text-blue-500 hover:underline mt-1 block"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
          >
            Show more
          </button>
        )}
        {isExpanded && (
          <button
            className="text-xs text-blue-500 hover:underline mt-1 block"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
          >
            Show less
          </button>
        )}
      </div>
    </Card>
  );
}
