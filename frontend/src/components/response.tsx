'use client';

import { cn } from '@/lib/utils';
import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => {
    // Sanitize children to prevent React component errors
    const sanitizedChildren = typeof children === 'string' 
      ? sanitizeMarkdownContent(children)
      : children;

    return (
      <Streamdown
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className
        )}
        {...props}
      >
        {sanitizedChildren}
      </Streamdown>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

function sanitizeMarkdownContent(content: string): string {
  // Remove or escape problematic XML tags that could cause React errors
  return content
    // Remove standalone opening tags that could be mistaken for React components
    .replace(/<([a-z][a-z0-9]*)(?![a-zA-Z0-9\s/>])/g, '&lt;$1')
    // Remove standalone closing tags
    .replace(/<\/([a-z][a-z0-9]*)>/g, '&lt;/$1&gt;')
    // Remove self-closing tags that aren't valid HTML
    .replace(/<([a-z][a-z0-9]*)\s*\/>/g, '&lt;$1/&gt;')
    // Keep valid HTML tags and known XML tool tags
    .replace(/&lt;(ask|complete|web-browser-takeover|function_calls|invoke|parameter)([^>]*)&gt;/g, '<$1$2>')
    .replace(/&lt;\/(ask|complete|web-browser-takeover|function_calls|invoke|parameter)&gt;/g, '</$1>');
}

Response.displayName = 'Response';
