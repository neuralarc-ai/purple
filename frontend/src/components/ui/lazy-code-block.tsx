import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { codeToHtml } from 'shiki';

export type LazyCodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
  threshold?: number; // Minimum lines to trigger lazy loading
} & React.HTMLProps<HTMLDivElement>;

function LazyCodeBlockCode({
  code,
  language = 'tsx',
  theme: propTheme,
  className,
  threshold = 50, // Default threshold: 50 lines
  ...props
}: LazyCodeBlockCodeProps) {
  const { resolvedTheme } = useTheme();
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  // Use github-dark when in dark mode, github-light when in light mode
  const theme =
    propTheme || (resolvedTheme === 'dark' ? 'github-dark' : 'github-light');

  // Check if code is large enough to warrant lazy loading
  const lineCount = code.split('\n').length;
  const shouldLazyLoad = lineCount > threshold;

  const highlightCode = useCallback(async () => {
    if (!code || typeof code !== 'string') {
      setHighlightedHtml(null);
      return;
    }

    try {
      const html = await codeToHtml(code, {
        lang: language,
        theme,
        transformers: [
          {
            pre(node) {
              if (node.properties.style) {
                node.properties.style = (node.properties.style as string)
                  .replace(/background-color:[^;]+;?/g, '');
              }
            }
          }
        ]
      });
      setHighlightedHtml(html);
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      setHighlightedHtml(null);
    }
  }, [code, language, theme]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!shouldLazyLoad) {
      // For small code blocks, highlight immediately
      highlightCode();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            setIsLoading(true);
            highlightCode().finally(() => setIsLoading(false));
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before the element comes into view
      }
    );

    if (codeRef.current) {
      observer.observe(codeRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [shouldLazyLoad, isVisible, highlightCode]);

  const classNames = cn(
    '[&_pre]:!bg-background/95 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:!overflow-x-auto [&_pre]:!w-px [&_pre]:!flex-grow [&_pre]:!min-w-0 [&_pre]:!box-border [&_.shiki]:!overflow-x-auto [&_.shiki]:!w-px [&_.shiki]:!flex-grow [&_.shiki]:!min-w-0 [&_code]:!min-w-0 [&_code]:!whitespace-pre',
    'w-px flex-grow min-w-0 overflow-hidden flex w-full',
    className
  );

  // For small code blocks, render immediately
  if (!shouldLazyLoad) {
    return highlightedHtml ? (
      <div
        className={classNames}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        {...props}
      />
    ) : (
      <div className={classNames} {...props}>
        <pre className="!overflow-x-auto !w-px !flex-grow !min-w-0 !box-border">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  // For large code blocks, use lazy loading
  return (
    <div ref={codeRef} className={classNames} {...props}>
      {isVisible ? (
        isLoading ? (
          // Loading state
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Highlighting code...</span>
            </div>
          </div>
        ) : highlightedHtml ? (
          // Highlighted code
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          // Fallback to plain code
          <pre className="!overflow-x-auto !w-px !flex-grow !min-w-0 !box-border">
            <code>{code}</code>
          </pre>
        )
      ) : (
        // Placeholder while not visible
        <pre className="!overflow-x-auto !w-px !flex-grow !min-w-0 !box-border">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

export { LazyCodeBlockCode };
