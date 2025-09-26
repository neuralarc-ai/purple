import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { memo, useId, useMemo } from 'react';
import { Response } from '@/components/response';
import { CodeBlock } from '@/components/ui/code-block';
import { LazyCodeBlockCode } from '@/components/ui/lazy-code-block';

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: any; // Simplified for now, can be enhanced later
  enableOverflowHandling?: boolean; // Add prop for conditional overflow handling
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  // Sanitize markdown to remove or escape problematic XML tags
  const sanitizedMarkdown = sanitizeMarkdown(markdown);
  const tokens = marked.lexer(sanitizedMarkdown);
  return tokens.map((token: any) => token.raw);
}

function sanitizeMarkdown(markdown: string): string {
  // Remove or escape problematic XML tags that could cause React errors
  // This includes tags that look like React components but aren't properly formed
  return markdown
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

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext';
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : 'plaintext';
}

// Custom components for the Response component
const CUSTOM_COMPONENTS = {
  code: function CodeComponent({ className, children, ...props }: any) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    if (isInline) {
      return (
        <span
          className={cn(
            'bg-primary-foreground dark:bg-zinc-800 dark:border dark:border-zinc-700 rounded-sm px-1 font-mono text-sm',
            className,
          )}
          {...props}
        >
          {children}
        </span>
      );
    }

    const language = extractLanguage(className);

    return (
      <CodeBlock className="rounded-md overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800 max-w-full min-w-0 w-full">
        <LazyCodeBlockCode
          code={children as string}
          language={language}
          className="text-sm"
          threshold={30} // Lazy load code blocks with more than 30 lines
        />
      </CodeBlock>
    );
  },
  pre: function PreComponent({ children }: any) {
    return <>{children}</>;
  },
  ul: function UnorderedList({ children, ...props }: any) {
    return (
      <ul className="list-disc pl-5 my-2" {...props}>
        {children}
      </ul>
    );
  },
  ol: function OrderedList({ children, ...props }: any) {
    return (
      <ol className="list-decimal pl-5 my-2" {...props}>
        {children}
      </ol>
    );
  },
  li: function ListItem({ children, ...props }: any) {
    return (
      <li className="my-1" {...props}>
        {children}
      </li>
    );
  },
  h1: function H1({ children, ...props }: any) {
    return (
      <h1 className="text-2xl font-bold my-3 libre-baskerville-bold" {...props}>
        {children}
      </h1>
    );
  },
  h2: function H2({ children, ...props }: any) {
    return (
      <h2 className="text-xl font-bold my-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: function H3({ children, ...props }: any) {
    return (
      <h3 className="text-lg font-bold my-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: function H4({ children, ...props }: any) {
    return (
      <h4 className="text-base font-bold my-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: function H5({ children, ...props }: any) {
    return (
      <h5 className="text-sm font-bold my-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: function H6({ children, ...props }: any) {
    return (
      <h6 className="text-xs font-bold my-2" {...props}>
        {children}
      </h6>
    );
  },
  p: function Paragraph({ children, ...props }: any) {
    return (
      <p className="my-2 leading-relaxed" {...props}>
        {children}
      </p>
    );
  },
  blockquote: function Blockquote({ children, ...props }: any) {
    return (
      <blockquote
        className="border-l-4 border-primary pl-4 my-3 italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  a: function Anchor({ children, href, ...props }: any) {
    return (
      <a
        href={href}
        className="hover:underline text-helium-blue"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  table: function Table({ children, ...props }: any) {
    return (
      <div className="table-wrapper overflow-x-auto my-3 border border-slate-300 dark:border-zinc-700 rounded-md max-w-full">
        <table className="w-full border-collapse text-sm min-w-0" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th: function TableHeader({ children, ...props }: any) {
    return (
      <th
        className="border-r border-b border-slate-300 dark:border-zinc-700 px-3 py-2 text-left font-semibold bg-slate-100 dark:bg-zinc-800 whitespace-nowrap"
        {...props}
      >
        {children}
      </th>
    );
  },
  td: function TableCell({ children, ...props }: any) {
    return (
      <td
        className="border-r border-b border-slate-300 dark:border-zinc-700 px-3 py-2 whitespace-nowrap"
        {...props}
      >
        {children}
      </td>
    );
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = CUSTOM_COMPONENTS,
  }: {
    content: string;
    components?: any;
  }) {
    return (
      <Response
        className="prose prose-sm dark:prose-invert max-w-none"
        components={components}
      >
        {content}
      </Response>
    );
  },
  function propsAreEqual(prevProps: any, nextProps: any) {
    return prevProps.content === nextProps.content;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

function MarkdownComponent({
  children,
  id,
  className,
  components = CUSTOM_COMPONENTS,
  enableOverflowHandling = false,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div
      className={cn(
        'prose-code:before:hidden prose-code:after:hidden',
        enableOverflowHandling && 'thread-content-container',
        'min-w-0 max-w-full', // Ensure container can shrink and doesn't overflow
        className,
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';

export { Markdown };
