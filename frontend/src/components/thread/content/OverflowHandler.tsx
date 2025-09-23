import React from 'react';

interface OverflowHandlerProps {
  children: React.ReactNode;
  content: string;
  enableOverflowHandling: boolean;
}

// Function to detect if content has elements that might cause overflow
function hasProblematicContent(content: string): boolean {
  // Check for long URLs
  const urlRegex = /https?:\/\/[^\s]{50,}/;
  if (urlRegex.test(content)) return true;
  
  // Check for tables (markdown tables with | separators)
  const lines = content.split('\n');
  const tableLines = lines.filter(line => line.includes('|') && line.trim().length > 0);
  if (tableLines.length >= 2) {
    // Check if it looks like a proper table (has header separator)
    const hasHeaderSeparator = tableLines.some(line => /^\s*\|?[\s\-\|:]+\|?\s*$/.test(line));
    if (hasHeaderSeparator) return true;
    
    // Or if multiple consecutive lines have pipes (likely a table)
    if (tableLines.length >= 3) return true;
  }
  
  // Check for code blocks
  if (content.includes('```') || content.includes('<pre>')) return true;
  
  // Check for very long words (more than 50 characters)
  const longWordRegex = /\S{50,}/;
  if (longWordRegex.test(content)) return true;
  
  // Check for wide content that might overflow
  const wideContentRegex = /\S{100,}/;
  if (wideContentRegex.test(content)) return true;
  
  return false;
}

export const OverflowHandler: React.FC<OverflowHandlerProps> = ({
  children,
  content,
  enableOverflowHandling
}) => {
  const needsOverflowHandling = enableOverflowHandling && hasProblematicContent(content);
  
  return (
    <div className={needsOverflowHandling ? 'side-panel-overflow-handler' : ''}>
      {children}
    </div>
  );
};