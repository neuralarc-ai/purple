import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AgentErrorBannerProps {
  error: string;
  onContinue: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AgentErrorBanner({ 
  error, 
  onContinue, 
  onDismiss,
  className 
}: AgentErrorBannerProps) {
  // Parse error message to provide more user-friendly text
  const getErrorMessage = (error: string): string => {
    const lower = error.toLowerCase();
    
    if (lower.includes('too many requests') || lower.includes('rate limit')) {
      return 'Rate limit exceeded. The service is temporarily busy.';
    }
    
    if (lower.includes('redis') && lower.includes('connection')) {
      return 'Connection error occurred. The service is temporarily unavailable.';
    }
    
    if (lower.includes('litellm') && lower.includes('error')) {
      return 'AI service error occurred. Please try again.';
    }
    
    if (lower.includes('timeout')) {
      return 'Request timed out. The operation took too long to complete.';
    }
    
    if (lower.includes('internal server error')) {
      return 'Internal server error has occurred. Please try again later.';
    }
    
    // Default fallback
    return error || 'An unexpected error occurred.';
  };

  const getErrorCode = (error: string): string | null => {
    // Extract error codes from common patterns
    const match = error.match(/\((\d+)\)/);
    return match ? match[1] : null;
  };

  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
      className
    )}>
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Agent Error
          </h3>
          {errorCode && (
            <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800/50 px-2 py-0.5 rounded">
              {errorCode}
            </span>
          )}
        </div>
        
        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
          {errorMessage}
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onContinue}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Please continue
          </Button>
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
