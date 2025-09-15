'use client'

import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Wrench,
  Settings,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ToolViewProps } from './types';
import { formatTimestamp, getToolTitle, extractToolData } from './utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from './shared/LoadingState';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Utility function to detect if data is tabular
const isTabularData = (data: any): boolean => {
  // Handle nested structures that might contain tabular data
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // Check if it's an object with a 'data' field containing an array
    if (data.data && Array.isArray(data.data)) {
      return isTabularData(data.data);
    }
    // Check if it's an object with a 'results' field containing an array
    if (data.results && Array.isArray(data.results)) {
      return isTabularData(data.results);
    }
    // Check if it's an object with a 'records' field containing an array
    if (data.records && Array.isArray(data.records)) {
      return isTabularData(data.records);
    }
    // Check if it's an object with a 'items' field containing an array
    if (data.items && Array.isArray(data.items)) {
      return isTabularData(data.items);
    }
    // Check if it's an object with a 'list' field containing an array
    if (data.list && Array.isArray(data.list)) {
      return isTabularData(data.list);
    }
    // Check if it's an object with a 'tools' field containing an array
    if (data.tools && Array.isArray(data.tools)) {
      return isTabularData(data.tools);
    }
  }
  
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // Check if all items are objects with similar structure
  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) return false;
  
  const firstItemKeys = Object.keys(firstItem);
  if (firstItemKeys.length === 0) return false;
  
  // Check for common database/API field patterns that indicate tabular data
  const hasCommonFields = firstItemKeys.some(key => 
    key.toLowerCase().includes('id') ||
    key.toLowerCase().includes('name') ||
    key.toLowerCase().includes('email') ||
    key.toLowerCase().includes('date') ||
    key.toLowerCase().includes('time') ||
    key.toLowerCase().includes('amount') ||
    key.toLowerCase().includes('status') ||
    key.toLowerCase().includes('type') ||
    key.toLowerCase().includes('created') ||
    key.toLowerCase().includes('modified') ||
    key.toLowerCase().includes('updated') ||
    key.toLowerCase().includes('account') ||
    key.toLowerCase().includes('deal') ||
    key.toLowerCase().includes('owner') ||
    key.toLowerCase().includes('stage') ||
    key.toLowerCase().includes('contact') ||
    key.toLowerCase().includes('lead') ||
    key.toLowerCase().includes('opportunity') ||
    key.toLowerCase().includes('description') ||
    key.toLowerCase().includes('tool') ||
    key.toLowerCase().includes('function') ||
    key.toLowerCase().includes('schema')
  );
  
  // Check for tool-specific patterns
  const hasToolFields = firstItemKeys.some(key => 
    key.toLowerCase().includes('tool') ||
    key.toLowerCase().includes('function') ||
    key.toLowerCase().includes('action') ||
    key.toLowerCase().includes('method') ||
    key.toLowerCase().includes('endpoint') ||
    key.toLowerCase().includes('schema') ||
    key.toLowerCase().includes('input') ||
    key.toLowerCase().includes('output') ||
    key.toLowerCase().includes('parameter')
  );
  
  // If it has common database fields or tool fields, be more lenient with structure matching
  const threshold = (hasCommonFields || hasToolFields) ? 0.3 : 0.8;
  const minMatchingItems = Math.max(1, Math.floor(data.length * threshold));
  let matchingItems = 0;
  
  for (const item of data) {
    if (typeof item === 'object' && item !== null) {
      const itemKeys = Object.keys(item);
      // For database-like or tool-like data, check if some keys match
      if (hasCommonFields || hasToolFields) {
        const matchingKeys = firstItemKeys.filter(key => itemKeys.includes(key));
        if (matchingKeys.length >= Math.floor(firstItemKeys.length * 0.4)) {
          matchingItems++;
        }
      } else {
        // For other data, require exact key match
        if (itemKeys.length === firstItemKeys.length && 
            firstItemKeys.every(key => itemKeys.includes(key))) {
          matchingItems++;
        }
      }
    }
  }
  
  return matchingItems >= minMatchingItems;
};

// Utility function to format tabular data as text
const formatTabularDataAsText = (data: any[]): string => {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  
  let result = '';
  
  // Add header
  result += keys.join(' | ') + '\n';
  result += keys.map(() => '---').join(' | ') + '\n';
  
  // Add rows
  for (const item of data) {
    const row = keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') {
        // Handle nested objects (like Account_Name, Owner)
        if (value.name) return value.name;
        if (value.email) return value.email;
        return JSON.stringify(value);
      }
      return String(value);
    });
    result += row.join(' | ') + '\n';
  }
  
  return result;
};

// Utility function to format non-tabular data as readable text
const formatDataAsText = (data: any): string => {
  if (data === null || data === undefined) return 'null';
  
  if (typeof data === 'string') return data;
  
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  
  if (Array.isArray(data)) {
    if (isTabularData(data)) {
      return formatTabularDataAsText(data);
    }
    
    // Format as list
    return data.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return `${index + 1}. ${JSON.stringify(item, null, 2)}`;
      }
      return `${index + 1}. ${String(item)}`;
    }).join('\n\n');
  }
  
  if (typeof data === 'object') {
    // Check if this object contains tabular data in common fields
    const tabularFields = ['data', 'results', 'records', 'items', 'list'];
    for (const field of tabularFields) {
      if (data[field] && Array.isArray(data[field]) && isTabularData(data[field])) {
        // Format the tabular data and include other fields as metadata
        let result = '';
        const otherFields = Object.entries(data).filter(([key]) => key !== field);
        if (otherFields.length > 0) {
          result += otherFields.map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return `${key}: ${JSON.stringify(value, null, 2)}`;
            }
            return `${key}: ${String(value)}`;
          }).join('\n') + '\n\n';
        }
        result += formatTabularDataAsText(data[field]);
        return result;
      }
    }
    
    // Format object properties as key-value pairs
    const entries = Object.entries(data);
    return entries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}: ${JSON.stringify(value, null, 2)}`;
      }
      return `${key}: ${String(value)}`;
    }).join('\n');
  }
  
  return String(data);
};

// Component to render tabular data as a table
const TabularDataTable: React.FC<{ data: any[] }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  const firstItem = data[0];
  const allKeys = Object.keys(firstItem);
  
  // Filter out complex nested objects that clutter the table
  const filteredKeys = allKeys.filter(key => {
    const value = firstItem[key];
    
    // Skip complex nested objects
    if (typeof value === 'object' && value !== null) {
      // Skip if it's a complex object with many properties (like inputSchema)
      if (Object.keys(value).length > 3) {
        return false;
      }
      
      // Skip specific complex fields
      const complexFields = ['inputSchema', 'outputSchema', 'schema', 'parameters', 'config', 'settings', 'metadata'];
      if (complexFields.some(field => key.toLowerCase().includes(field))) {
        return false;
      }
    }
    
    return true;
  });
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {filteredKeys.map((key) => (
              <TableHead key={key} className="font-medium">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              {filteredKeys.map((key) => {
                const value = item[key];
                let displayValue = '';
                
                if (value === null || value === undefined) {
                  displayValue = '';
                } else if (typeof value === 'object') {
                  // Handle nested objects (like Account_Name, Owner)
                  if (value.name) {
                    displayValue = value.name;
                  } else if (value.email) {
                    displayValue = value.email;
                  } else if (value.id) {
                    displayValue = value.id;
                  } else {
                    displayValue = JSON.stringify(value);
                  }
                } else {
                  displayValue = String(value);
                }
                
                return (
                  <TableCell key={key} className="text-sm">
                    {displayValue}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export function GenericToolView({
  name = 'generic-tool',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const toolTitle = getToolTitle(name);


  const formatContent = (content: any) => {
    if (!content) return null;

    // Use the new parser for backwards compatibility
    const { toolResult } = extractToolData(content);

    if (toolResult) {
      // Try to parse the tool output to determine if it's tabular data
      let parsedOutput = toolResult.toolOutput;
      try {
        if (typeof toolResult.toolOutput === 'string') {
          parsedOutput = JSON.parse(toolResult.toolOutput);
        }
      } catch {
        // Keep as string if parsing fails
      }
      
      // Helper function to check if data contains tabular data
      const hasTabularData = (data: any): boolean => {
        if (Array.isArray(data) && isTabularData(data)) return true;
        if (typeof data === 'object' && data !== null) {
          const tabularFields = ['data', 'results', 'records', 'items', 'list', 'tools'];
          
          // Check direct fields first
          if (tabularFields.some(field => 
            data[field] && Array.isArray(data[field]) && isTabularData(data[field])
          )) {
            return true;
          }
          
          // Check nested fields (for cases like { data: { data: [...] } })
          for (const field of tabularFields) {
            if (data[field] && typeof data[field] === 'object' && data[field] !== null) {
              const nestedData = data[field];
              if (tabularFields.some(nestedField => 
                nestedData[nestedField] && Array.isArray(nestedData[nestedField]) && isTabularData(nestedData[nestedField])
              )) {
                return true;
              }
            }
          }
        }
        return false;
      };
      
      // Determine the output format based on whether it contains tabular data
      let outputText;
      if (typeof parsedOutput === 'string') {
        outputText = parsedOutput;
      } else if (hasTabularData(parsedOutput)) {
        // For tabular data, create a simple description but keep raw for table rendering
        const tabularFields = ['data', 'results', 'records', 'items', 'list', 'tools'];
        
        // Check direct fields first
        let tabularField = tabularFields.find(field => 
          parsedOutput[field] && Array.isArray(parsedOutput[field]) && isTabularData(parsedOutput[field])
        );
        
        // Check nested fields if no direct field found
        if (!tabularField) {
          for (const field of tabularFields) {
            if (parsedOutput[field] && typeof parsedOutput[field] === 'object' && parsedOutput[field] !== null) {
              const nestedData = parsedOutput[field];
              tabularField = tabularFields.find(nestedField => 
                nestedData[nestedField] && Array.isArray(nestedData[nestedField]) && isTabularData(nestedData[nestedField])
              );
              if (tabularField) break;
            }
          }
        }
        
        if (tabularField && Array.isArray(parsedOutput[tabularField])) {
          const count = (parsedOutput[tabularField] as any[]).length;
          outputText = `Found ${count} ${tabularField} record${count !== 1 ? 's' : ''}`;
        } else if (Array.isArray(parsedOutput) && isTabularData(parsedOutput)) {
          outputText = `Found ${(parsedOutput as any[]).length} record${(parsedOutput as any[]).length !== 1 ? 's' : ''}`;
        } else {
          outputText = 'Tabular data found';
        }
      } else {
        // For regular JSON, format as readable text
        outputText = formatDataAsText(parsedOutput);
      }
      
      const result = {
        tool: toolResult.xmlTagName || toolResult.functionName,
        arguments: toolResult.arguments || {},
        output: outputText,
        rawOutput: parsedOutput, // Keep raw data for table rendering
        success: toolResult.isSuccess,
        summary: toolResult.summary || '',
        timestamp: toolResult.timestamp,
      };
      return result;
    }

    // Fallback to legacy format handling
    if (typeof content === 'object') {
      // Check for direct structured format (legacy)
      if ('tool_name' in content || 'xml_tag_name' in content) {
        const result = {
          tool: content.tool_name || content.xml_tag_name || 'unknown',
          arguments: content.parameters || {},
          output: typeof content.result === 'string' ? content.result : formatDataAsText(content.result || ''),
          rawOutput: content.result,
          success: content.success !== false,
          summary: '',
          timestamp: undefined,
        };
        return result;
      }

      // Check if it has a content field that might contain the structured data (legacy)
      if ('content' in content && typeof content.content === 'object') {
        const innerContent = content.content;
        if ('tool_name' in innerContent || 'xml_tag_name' in innerContent) {
          const result = {
            tool: innerContent.tool_name || innerContent.xml_tag_name || 'unknown',
            arguments: innerContent.parameters || {},
            output: typeof innerContent.result === 'string' ? innerContent.result : formatDataAsText(innerContent.result || ''),
            rawOutput: innerContent.result,
            success: innerContent.success !== false,
            summary: '',
            timestamp: undefined,
          };
          return result;
        }
      }

      // Fall back to old format handling
      if (content.content && typeof content.content === 'string') {
        const result = { 
          tool: 'unknown',
          arguments: {},
          output: content.content,
          success: true,
          summary: '',
          timestamp: undefined,
        };
        return result;
      }
      
      // Ensure we always return a string output for objects to prevent React rendering issues
      const safeOutput = typeof content === 'object' ? formatDataAsText(content) : String(content);
      const result = { 
        tool: 'unknown',
        arguments: {},
        output: safeOutput,
        rawOutput: content,
        success: true,
        summary: '',
        timestamp: undefined,
      };
      return result;
    }

    if (typeof content === 'string') {
      try {
        const parsedJson = JSON.parse(content);
        if (typeof parsedJson === 'object') {
          const result = { 
            tool: 'unknown',
            arguments: {},
            output: formatDataAsText(parsedJson),
            rawOutput: parsedJson,
            success: true,
            summary: '',
            timestamp: undefined,
          };
          return result;
        }
        const result = { 
          tool: 'unknown',
          arguments: {},
          output: content,
          success: true,
          summary: '',
          timestamp: undefined,
        };
        return result;
      } catch (e) {
        const result = { 
          tool: 'unknown',
          arguments: {},
          output: content,
          success: true,
          summary: '',
          timestamp: undefined,
        };
        return result;
      }
    }

    // Ensure we always return a string output to prevent React rendering issues
    const result = { 
      tool: 'unknown',
      arguments: {},
      output: String(content),
      success: true,
      summary: '',
      timestamp: undefined,
    };
    return result;
  };

  // Ensure the formatted content always has the expected structure
  const ensureFormattedContent = (formatted: any) => {
    if (!formatted) return null;
    
    // Ensure output is always a string
    if (formatted.output && typeof formatted.output !== 'string') {
      try {
        formatted.output = JSON.stringify(formatted.output, null, 2);
      } catch (error) {
        console.warn('Failed to stringify formatted output:', error);
        formatted.output = String(formatted.output);
      }
    }
    
    // Ensure arguments is always an object
    if (formatted.arguments && typeof formatted.arguments !== 'object') {
      try {
        formatted.arguments = typeof formatted.arguments === 'string' 
          ? JSON.parse(formatted.arguments) 
          : {};
      } catch (error) {
        console.warn('Failed to parse formatted arguments:', error);
        formatted.arguments = {};
      }
    }
    
    // Ensure summary is always a string
    if (formatted.summary && typeof formatted.summary !== 'string') {
      try {
        formatted.summary = JSON.stringify(formatted.summary, null, 2);
      } catch (error) {
        console.warn('Failed to stringify formatted summary:', error);
        formatted.summary = String(formatted.summary);
      }
    }
    
    return formatted;
  };

  const formattedAssistantContent = React.useMemo(
    () => {
      try {
        return ensureFormattedContent(formatContent(assistantContent));
      } catch (error) {
        console.error('Error formatting assistant content:', error);
        return {
          tool: 'unknown',
          arguments: {},
          output: 'Error processing assistant content',
          success: false,
          summary: '',
          timestamp: undefined,
        };
      }
    },
    [assistantContent],
  );
  const formattedToolContent = React.useMemo(
    () => {
      try {
        return ensureFormattedContent(formatContent(toolContent));
      } catch (error) {
        console.error('Error formatting tool content:', error);
        return {
          tool: 'unknown',
          arguments: {},
          output: 'Error processing tool content',
          success: false,
          summary: '',
          timestamp: undefined,
        };
      }
    },
    [toolContent],
  );

  const renderArguments = (args: Record<string, any>) => {
    if (!args || Object.keys(args).length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          Parameters
        </div>
        <div className="bg-accent rounded-xl border p-4 space-y-3">
          {Object.entries(args).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="bg-background rounded-lg border p-3">
                {/* Ensure we never try to render objects directly */}
                {renderValue(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOutput = (output: string, title: string = 'Output', rawOutput?: any) => {
    if (!output) return null;

    // Helper function to extract tabular data from nested structures
    const extractTabularData = (data: any): any[] | null => {
      if (Array.isArray(data) && isTabularData(data)) {
        return data;
      }
      
      if (typeof data === 'object' && data !== null) {
        const tabularFields = ['data', 'results', 'records', 'items', 'list', 'tools'];
        
        // Check direct fields first
        for (const field of tabularFields) {
          if (data[field] && Array.isArray(data[field]) && isTabularData(data[field])) {
            return data[field];
          }
        }
        
        // Check nested fields (for cases like { data: { data: [...] } })
        for (const field of tabularFields) {
          if (data[field] && typeof data[field] === 'object' && data[field] !== null) {
            const nestedData = data[field];
            for (const nestedField of tabularFields) {
              if (nestedData[nestedField] && Array.isArray(nestedData[nestedField]) && isTabularData(nestedData[nestedField])) {
                return nestedData[nestedField];
              }
            }
          }
        }
      }
      
      return null;
    };

    // Check if we have raw output data that might be tabular
    const tabularData = extractTabularData(rawOutput);
    if (tabularData) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {title}
          </div>
          <div className="space-y-4">
            {/* Show descriptive text */}
            <div className="bg-muted/50 rounded-xl border p-4">
              <div className="text-base text-foreground whitespace-pre-wrap break-words">
                {output}
              </div>
            </div>
            {/* Show table */}
            <div className="bg-muted/50 rounded-xl border p-4">
              <TabularDataTable data={tabularData} />
            </div>
          </div>
        </div>
      );
    }

    // Try to parse the output string to check if it contains tabular data
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(output);
    } catch {
      // If parsing fails, treat as regular text
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {title}
          </div>
          <div className="bg-muted/50 rounded-xl border p-4">
            <div className="text-base text-foreground whitespace-pre-wrap break-words">
              {output}
            </div>
          </div>
        </div>
      );
    }

    // Check if the parsed output contains tabular data
    const tabularDataFromOutput = extractTabularData(parsedOutput);
    if (tabularDataFromOutput) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {title}
          </div>
          <div className="space-y-4">
            {/* Show descriptive text */}
            <div className="bg-muted/50 rounded-xl border p-4">
              <div className="text-base text-foreground whitespace-pre-wrap break-words">
                {output}
              </div>
            </div>
            {/* Show table */}
            <div className="bg-muted/50 rounded-xl border p-4">
              <TabularDataTable data={tabularDataFromOutput} />
            </div>
          </div>
        </div>
      );
    }

    // For non-tabular data, display as formatted text
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="bg-muted/50 rounded-xl border p-4">
          <div className="text-base text-foreground whitespace-pre-wrap break-words">
            {output}
          </div>
        </div>
      </div>
    );
  };

  const renderValue = (value: any): React.ReactNode => {
    // Ensure we never try to render objects directly
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {value ? '✓ True' : '✗ False'}
        </span>
      );
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono text-foreground">{value}</span>;
    }
    
    if (typeof value === 'string') {
      // Check if it's a URL
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-foreground hover:text-muted-foreground underline break-all"
          >
            {value}
          </a>
        );
      }
      // Check if it's JSON
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object') {
          return (
            <div className="bg-muted/50 rounded p-2">
              <pre className="text-xs text-foreground overflow-x-auto">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          );
        }
      } catch {
        // Not JSON, treat as regular string
      }
      return <span className="text-foreground">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-foreground font-mono">[{index}]</span>
              <div className="flex-1">{renderValue(item)}</div>
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      // Ensure we always return a string representation for objects
      // This prevents React from trying to render objects directly
      try {
        const jsonString = JSON.stringify(value, null, 2);
        return (
          <div className="bg-muted/50 rounded p-2">
            <pre className="text-xs text-foreground overflow-x-auto">
              {jsonString}
            </pre>
          </div>
        );
      } catch (error) {
        // If JSON.stringify fails, use a safe fallback
        console.warn('Failed to stringify object:', value, error);
        return (
          <div className="bg-muted/50 rounded p-2">
            <pre className="text-xs text-foreground overflow-x-auto">
              {String(value)}
            </pre>
          </div>
        );
      }
    }
    
    // For any other type, convert to string safely
    // This is the final fallback to prevent any rendering issues
    const safeString = String(value);
    return <span className="text-foreground">{safeString}</span>;
  };

  const renderSummary = (summary: string) => {
    if (!summary) return null;

    // Ensure we never try to render objects directly
    const safeSummary = typeof summary === 'string' ? summary : String(summary);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          Summary
        </div>
        <div className="bg-muted/50 rounded-xl border p-4">
            <div className="text-base text-foreground whitespace-pre-wrap break-words">
              {/* Ensure we never try to render objects directly */}
              {renderValue(safeSummary)}
            </div>
        </div>
      </div>
    );
  };

  const renderErrorOutput = (output: string) => {
    if (!output) return null;

    // Ensure we never try to render objects directly
    const safeOutput = typeof output === 'string' ? output : String(output);

    // Try to parse the error output to extract meaningful information
    let errorInfo: {
      type: string;
      message: string;
      details: any;
      suggestions: string[];
    } = {
      type: 'general',
      message: safeOutput,
      details: null,
      suggestions: []
    };

    try {
      // Check if it's a JSON error
      if (safeOutput.includes('Error parsing arguments:') || safeOutput.includes('Error executing')) {
        const errorMatch = safeOutput.match(/Error (?:parsing arguments|executing [^:]+):\s*(.*)/);
        if (errorMatch) {
          errorInfo.type = 'execution';
          errorInfo.message = errorMatch[1];
          
          // Try to extract validation errors
          try {
            const jsonMatch = safeOutput.match(/\[([\s\S]*)\]/);
            if (jsonMatch) {
              const validationErrors = JSON.parse(jsonMatch[1]);
              errorInfo.details = validationErrors;
              errorInfo.suggestions = [
                'Check parameter types and formats',
                'Verify required fields are provided',
                'Ensure data matches expected schema'
              ];
            }
          } catch {
            // If JSON parsing fails, keep the original message
          }
        }
      } else if (safeOutput.includes('Error')) {
        // Handle any other error format
        errorInfo.type = 'general';
        errorInfo.message = safeOutput.replace(/^Error\s*:?\s*/i, '');
        errorInfo.suggestions = [
          'Review the input parameters',
          'Check if all required fields are provided',
          'Verify the data format matches expectations'
        ];
      }
    } catch {
      // If any parsing fails, use the original output
    }

    return (
      <div className="space-y-4">
        <div className="bg-accent rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  {errorInfo.type === 'execution' ? 'Parameter Validation' : 'Processing Notice'}
                </h4>
                <div className="text-sm text-foreground leading-relaxed">
                  {errorInfo.message}
                </div>
              </div>

              {errorInfo.details && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Field Issues
                  </div>
                  <div className="bg-background rounded-lg border p-2 space-y-1">
                    {Array.isArray(errorInfo.details) ? errorInfo.details.map((detail: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <span className="text-amber-500 dark:text-amber-400">•</span>
                        <div className="flex-1">
                          <span className="font-medium text-foreground">
                            {detail.path?.join('.') || 'Field'}: 
                          </span>
                          <span className="text-foreground ml-1">
                            {detail.message || 'Invalid value'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-xs text-foreground">
                        {JSON.stringify(errorInfo.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errorInfo.suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Next Steps
                  </div>
                  <div className="bg-background rounded-lg border p-2">
                    <ul className="space-y-1">
                      {errorInfo.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <span className="text-amber-500 dark:text-amber-400">•</span>
                          <span className="text-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="gap-0 flex border shadow-none p-0 rounded-lg flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-9 bg-gradient-to-t from-muted/80 to-muted/70 text-center backdrop-blur-lg border-b p-2 px-4 space-y-2 rounded-t-lg">
        <div className="flex flex-row items-center justify-between">
          <div className="flex w-full justify-center items-center gap-1">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {toolTitle}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Wrench}
            iconColor="text-orange-500 dark:text-orange-400"
            bgColor="bg-gradient-to-b from-orange-100 to-orange-50 shadow-inner dark:from-orange-800/40 dark:to-orange-900/60 dark:shadow-orange-950/20"
            title="Executing tool"
            filePath={name}
            showProgress={true}
          />
        ) : (formattedAssistantContent || formattedToolContent) ? (
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-6">
              {/* Tool Input/Arguments */}
              {formattedAssistantContent?.arguments && Object.keys(formattedAssistantContent.arguments).length > 0 && (
                <>
                  {renderArguments(formattedAssistantContent.arguments)}
                  <Separator />
                </>
              )}

              {/* Tool Output */}
              {formattedToolContent?.output && (
                (isSuccess && !(typeof formattedToolContent.output === 'string' && formattedToolContent.output.includes('Error'))) 
                  ? renderOutput(formattedToolContent.output, 'Result', formattedToolContent.rawOutput)
                  : renderErrorOutput(formattedToolContent.output)
              )}

              {/* Tool Summary */}
              {formattedToolContent?.summary && (
                <>
                  {renderSummary(formattedToolContent.summary)}
                  <Separator />
                </>
              )}

              {/* Fallback for legacy content */}
              {!formattedToolContent?.output && !formattedToolContent?.summary && formattedToolContent && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Content
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {/* Ensure we never try to render objects directly */}
                      {renderValue(formattedToolContent)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-background to-muted/50">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-muted to-muted/50 shadow-inner">
              <Wrench className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No Content Available
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              This tool execution did not produce any input or output content to display.
            </p>
          </div>
        )}
      </CardContent>

      <div className="px-4 py-2 h-fit bg-card backdrop-blur-sm border-t border-border flex justify-between items-center gap-4 rounded-b-lg">
        <div className="h-full flex items-center gap-2 text-sm text-muted-foreground">
          {!isStreaming && (formattedAssistantContent || formattedToolContent) && (
            <Badge variant="outline" className="h-6 py-0.5 bg-muted">
              <Wrench className="h-3 w-3" />
              Tool
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {toolTimestamp && !isStreaming
            ? formatTimestamp(toolTimestamp)
            : assistantTimestamp
              ? formatTimestamp(assistantTimestamp)
              : ''}
        </div>
      </div>
    </Card>
  );
}
