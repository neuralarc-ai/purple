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
  
  // Check for tables
  if (content.includes('|') && content.split('\n').some(line => line.includes('|'))) return true;
  
  // Check for code blocks
  if (content.includes('```') || content.includes('<pre>')) return true;
  
  // Check for very long words (more than 50 characters)
  const longWordRegex = /\S{50,}/;
  if (longWordRegex.test(content)) return true;
  
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