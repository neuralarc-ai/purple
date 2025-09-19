import { extractToolData, normalizeContentToString } from '../utils';

export interface ImageEditGenerateData {
  mode: 'generate' | 'edit' | null;
  prompt: string | null;
  imagePath: string | null;
  generatedImagePath: string | null;
  status: string | null;
  success?: boolean;
  timestamp?: string;
  error?: string | null;
  
}

const parseContent = (content: any): any => {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }
  return content;
};

const extractFromNewFormat = (content: any): ImageEditGenerateData => {
  const parsedContent = parseContent(content);
  
  if (!parsedContent || typeof parsedContent !== 'object') {
    return { 
      mode: null, 
      prompt: null, 
      imagePath: null, 
      generatedImagePath: null, 
      status: null, 
      success: undefined, 
      timestamp: undefined,
      error: null
    };
  }

  if ('tool_execution' in parsedContent && typeof parsedContent.tool_execution === 'object') {
    const toolExecution = parsedContent.tool_execution;
    const args = toolExecution.arguments || {};
    const result = toolExecution.result || {};
    
    // Extract generated image path from the output
    let generatedImagePath: string | null = null;
    if (result.output && typeof result.output === 'string') {
      // Look for patterns like "Image saved as: generated_image_xxx.png"
      const imagePathMatch = result.output.match(/Image saved as:\s*([^\s.]+\.(png|jpg|jpeg|webp|gif))/i);
      if (imagePathMatch) {
        generatedImagePath = imagePathMatch[1];
      }
      
      // Also check for patterns like "generated_image_a7a40795.png" directly in the text
      if (!generatedImagePath) {
        const directImageMatch = result.output.match(/(generated_image_[a-f0-9]+\.(png|jpg|jpeg|webp|gif))/i);
        if (directImageMatch) {
          generatedImagePath = directImageMatch[1];
        }
      }
    }

    const extractedData: ImageEditGenerateData = {
      mode: args.mode || null,
      prompt: args.prompt || null,
      imagePath: args.image_path || null,
      generatedImagePath,
      status: result.output || null,
      success: result.success,
      timestamp: toolExecution.execution_details?.timestamp,
      error: result.error || null
    };
    
    // Filter out API-related status messages
    if (extractedData.status && (
      extractedData.status.toLowerCase().includes('api') ||
      extractedData.status.toLowerCase().includes('gemini') ||
      extractedData.status.toLowerCase().includes('generated using') ||
      extractedData.status.toLowerCase().includes('using gemini') ||
      extractedData.status.toLowerCase().includes('via gemini') ||
      extractedData.status.toLowerCase().includes('openai') ||
      extractedData.status.toLowerCase().includes('dall-e') ||
      extractedData.status.toLowerCase().includes('midjourney') ||
      extractedData.status.toLowerCase().includes('stable diffusion')
    )) {
      extractedData.status = null;
    }
    
    return extractedData;
  }

  // Check if this is a simple string content with image generation message
  if (typeof parsedContent === 'string') {
    const contentStr = parsedContent;
    let generatedImagePath: string | null = null;
    
    // Look for generated image patterns
    const imagePathMatch = contentStr.match(/Image saved as:\s*([^\s.]+\.(png|jpg|jpeg|webp|gif))/i);
    if (imagePathMatch) {
      generatedImagePath = imagePathMatch[1];
    }
    
    if (!generatedImagePath) {
      const directImageMatch = contentStr.match(/(generated_image_[a-f0-9]+\.(png|jpg|jpeg|webp|gif))/i);
      if (directImageMatch) {
        generatedImagePath = directImageMatch[1];
      }
    }
    
    if (generatedImagePath) {
      return {
        mode: contentStr.toLowerCase().includes('mode') ? 'generate' : null,
        prompt: null,
        imagePath: null,
        generatedImagePath,
        status: null, // Don't show the API message
        success: true,
        timestamp: undefined,
        error: null
      };
    }
  }

  if ('role' in parsedContent && 'content' in parsedContent) {
    return extractFromNewFormat(parsedContent.content);
  }

  return { 
    mode: null, 
    prompt: null, 
    imagePath: null, 
    generatedImagePath: null, 
    status: null, 
    success: undefined, 
    timestamp: undefined,
    error: null
  };
};

const extractFromLegacyFormat = (content: any): ImageEditGenerateData => {
  const toolData = extractToolData(content);
  
  if (toolData.toolResult && toolData.arguments) {
    // Extract generated image path from the result
    let generatedImagePath: string | null = null;
    if (toolData.toolResult && typeof toolData.toolResult === 'string') {
      const imagePathMatch = (toolData.toolResult as string).match(/Image saved as:\s*([^\s.]+\.(png|jpg|jpeg|webp|gif))/i);
      if (imagePathMatch) {
        generatedImagePath = imagePathMatch[1];
      }
      
      // Also check for patterns like "generated_image_a7a40795.png" directly in the text
      if (!generatedImagePath) {
        const directImageMatch = (toolData.toolResult as string).match(/(generated_image_[a-f0-9]+\.(png|jpg|jpeg|webp|gif))/i);
        if (directImageMatch) {
          generatedImagePath = directImageMatch[1];
        }
      }
    }
    
    const extractedData = {
      mode: toolData.arguments.mode || null,
      prompt: toolData.arguments.prompt || null,
      imagePath: toolData.arguments.image_path || null,
      generatedImagePath,
      status: toolData.toolResult?.toolOutput || null,
      success: toolData.toolResult?.isSuccess,
      timestamp: undefined,
      error: null
    };
    
    // Filter out API-related status messages
    if (extractedData.status && (
      extractedData.status.toLowerCase().includes('api') ||
      extractedData.status.toLowerCase().includes('gemini') ||
      extractedData.status.toLowerCase().includes('generated using') ||
      extractedData.status.toLowerCase().includes('using gemini') ||
      extractedData.status.toLowerCase().includes('via gemini') ||
      extractedData.status.toLowerCase().includes('openai') ||
      extractedData.status.toLowerCase().includes('dall-e') ||
      extractedData.status.toLowerCase().includes('midjourney') ||
      extractedData.status.toLowerCase().includes('stable diffusion')
    )) {
      extractedData.status = null;
    }
    
    return extractedData;
  }

  const contentStr = normalizeContentToString(content);
  if (!contentStr) {
    return { 
      mode: null, 
      prompt: null, 
      imagePath: null, 
      generatedImagePath: null, 
      status: null,
      success: undefined,
      timestamp: undefined,
      error: null
    };
  }

  // First check if this is a simple image generation message
  let generatedImagePath: string | null = null;
  const legacyImagePathMatch = contentStr.match(/Image saved as:\s*([^\s.]+\.(png|jpg|jpeg|webp|gif))/i);
  if (legacyImagePathMatch) {
    generatedImagePath = legacyImagePathMatch[1];
  }
  
  if (!generatedImagePath) {
    const legacyDirectImageMatch = contentStr.match(/(generated_image_[a-f0-9]+\.(png|jpg|jpeg|webp|gif))/i);
    if (legacyDirectImageMatch) {
      generatedImagePath = legacyDirectImageMatch[1];
    }
  }
  
  if (generatedImagePath) {
    return {
      mode: contentStr.toLowerCase().includes('mode') ? 'generate' : null,
      prompt: null,
      imagePath: null,
      generatedImagePath,
      status: null, // Don't show the API message
      success: true,
      timestamp: undefined,
      error: null
    };
  }

  // Try to extract data from XML-like format
  let mode: 'generate' | 'edit' | null = null;
  const modeMatch = contentStr.match(/<parameter name="mode">([^<]*)<\/parameter>/i);
  if (modeMatch) {
    mode = modeMatch[1].trim() as 'generate' | 'edit';
  }

  let prompt: string | null = null;
  const promptMatch = contentStr.match(/<parameter name="prompt">([^<]*)<\/parameter>/i);
  if (promptMatch) {
    prompt = promptMatch[1].trim();
  }

  let imagePath: string | null = null;
  const xmlImagePathMatch = contentStr.match(/<parameter name="image_path">([^<]*)<\/parameter>/i);
  if (xmlImagePathMatch) {
    imagePath = xmlImagePathMatch[1].trim();
  }

  // Try to extract generated image path from output (reuse variables from above)
  if (!generatedImagePath) {
    const xmlGeneratedImageMatch = contentStr.match(/Image saved as:\s*([^\s.]+\.(png|jpg|jpeg|webp|gif))/i);
    if (xmlGeneratedImageMatch) {
      generatedImagePath = xmlGeneratedImageMatch[1];
    }
  }
  
  // Also check for patterns like "generated_image_a7a40795.png" directly in the text
  if (!generatedImagePath) {
    const xmlDirectImageMatch = contentStr.match(/(generated_image_[a-f0-9]+\.(png|jpg|jpeg|webp|gif))/i);
    if (xmlDirectImageMatch) {
      generatedImagePath = xmlDirectImageMatch[1];
    }
  }
  
  return {
    mode,
    prompt,
    imagePath,
    generatedImagePath,
    status: null,
    success: undefined,
    timestamp: undefined,
    error: null
  };
};

export function extractImageEditGenerateData(
  assistantContent: any,
  toolContent: any,
  isSuccess: boolean,
  toolTimestamp?: string,
  assistantTimestamp?: string
): ImageEditGenerateData & {
  actualIsSuccess: boolean;
  actualToolTimestamp?: string;
  actualAssistantTimestamp?: string;
} {
  let actualIsSuccess = isSuccess;
  let actualToolTimestamp = toolTimestamp;
  let actualAssistantTimestamp = assistantTimestamp;

  const assistantNewFormat = extractFromNewFormat(assistantContent);
  const toolNewFormat = extractFromNewFormat(toolContent);

  // Prefer data from toolContent if it has meaningful data
  let finalData = { ...assistantNewFormat };
  
  if (toolNewFormat.mode || toolNewFormat.prompt || toolNewFormat.generatedImagePath) {
    finalData = { ...toolNewFormat };
    if (toolNewFormat.success !== undefined) {
      actualIsSuccess = toolNewFormat.success;
    }
    if (toolNewFormat.timestamp) {
      actualToolTimestamp = toolNewFormat.timestamp;
    }
  } else if (assistantNewFormat.mode || assistantNewFormat.prompt || assistantNewFormat.generatedImagePath) {
    if (assistantNewFormat.success !== undefined) {
      actualIsSuccess = assistantNewFormat.success;
    }
    if (assistantNewFormat.timestamp) {
      actualAssistantTimestamp = assistantNewFormat.timestamp;
    }
  } else {
    // Fall back to legacy format
    const assistantLegacy = extractFromLegacyFormat(assistantContent);
    const toolLegacy = extractFromLegacyFormat(toolContent);

    finalData = {
      mode: toolLegacy.mode || assistantLegacy.mode,
      prompt: toolLegacy.prompt || assistantLegacy.prompt,
      imagePath: toolLegacy.imagePath || assistantLegacy.imagePath,
      generatedImagePath: toolLegacy.generatedImagePath || assistantLegacy.generatedImagePath,
      status: toolLegacy.status || assistantLegacy.status,
      success: toolLegacy.success || assistantLegacy.success,
      timestamp: toolLegacy.timestamp || assistantLegacy.timestamp,
      error: toolLegacy.error || assistantLegacy.error
    };
  }
  
  return {
    ...finalData,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  };
}
