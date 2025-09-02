/**
 * Utility functions for improving user prompts to be more effective for LLM models
 */

export interface PromptImprovementSuggestion {
  improvedPrompt: string;
  improvements: string[];
}

/**
 * Improves a user prompt by applying best practices for LLM interaction
 * @param originalPrompt The original user prompt
 * @returns An improved version of the prompt with explanations
 */
export function improvePrompt(originalPrompt: string): PromptImprovementSuggestion {
  if (!originalPrompt.trim()) {
    return {
      improvedPrompt: originalPrompt,
      improvements: []
    };
  }

  let improvedPrompt = originalPrompt.trim();
  const improvements: string[] = [];

  // 1. Check if prompt is too short or vague
  if (improvedPrompt.length < 20 || isVague(improvedPrompt)) {
    improvedPrompt = expandVaguePrompt(improvedPrompt);
    improvements.push("Added context and specificity to make the request clearer");
  }

  // 2. Add natural language structure if missing
  if (!hasNaturalLanguageStructure(improvedPrompt)) {
    improvedPrompt = addNaturalLanguageStructure(improvedPrompt);
    improvements.push("Restructured to use natural, conversational language");
  }

  // 3. Add context if missing
  if (!hasContext(improvedPrompt)) {
    improvedPrompt = addContext(improvedPrompt);
    improvements.push("Added context to help understand the request better");
  }

  // 4. Break down complex tasks
  if (isComplexTask(improvedPrompt)) {
    improvedPrompt = breakDownComplexTask(improvedPrompt);
    improvements.push("Broke down complex request into clearer steps");
  }

  // 5. Add specific keywords if too generic
  if (isGeneric(improvedPrompt)) {
    improvedPrompt = addSpecificKeywords(improvedPrompt);
    improvements.push("Added specific and relevant keywords");
  }

  // 6. Ensure clarity and conciseness
  improvedPrompt = ensureClarityAndConciseness(improvedPrompt);
  if (improvedPrompt !== originalPrompt.trim()) {
    improvements.push("Improved clarity and conciseness");
  }

  return {
    improvedPrompt,
    improvements
  };
}

function isVague(prompt: string): boolean {
  const vaguePatterns = [
    /^(help|fix|do|make|create|write|build)$/i,
    /^(help me|fix this|do this|make this)$/i,
    /^(code|program|script|function)$/i,
    /^(website|app|application)$/i,
    /^(bug|error|issue|problem)$/i
  ];
  
  return vaguePatterns.some(pattern => pattern.test(prompt.trim())) || prompt.trim().split(' ').length < 3;
}

function expandVaguePrompt(prompt: string): string {
  const expansions: Record<string, string> = {
    'help': 'Help me with a specific task. Please provide detailed guidance on',
    'fix': 'Fix the following issue by identifying the problem and providing a solution for',
    'code': 'Write code that accomplishes the following specific functionality:',
    'website': 'Create a website with the following features and requirements:',
    'app': 'Build an application that includes these specific features:',
    'bug': 'Debug and fix the following issue in my code:',
    'error': 'Resolve this error by analyzing the problem and providing a solution:',
    'create': 'Create a detailed implementation for',
    'write': 'Write a comprehensive solution for',
    'build': 'Build a complete solution that includes'
  };

  const lowerPrompt = prompt.toLowerCase().trim();
  for (const [key, expansion] of Object.entries(expansions)) {
    if (lowerPrompt === key || lowerPrompt === `${key} me`) {
      return `${expansion} [please specify what you need help with]`;
    }
  }

  return `Please help me with the following specific task: ${prompt}. I need detailed guidance on how to accomplish this.`;
}

function hasNaturalLanguageStructure(prompt: string): boolean {
  // Check if prompt uses natural language patterns
  const naturalPatterns = [
    /^(please|can you|could you|i need|i want|help me)/i,
    /^(write|create|build|make|develop|implement)/i,
    /(for|with|that|which|where|when|how)/i
  ];
  
  return naturalPatterns.some(pattern => pattern.test(prompt));
}

function addNaturalLanguageStructure(prompt: string): string {
  // If it starts with a verb, make it more conversational
  if (/^(write|create|build|make|develop|implement|fix|debug|solve)/i.test(prompt)) {
    return `Please ${prompt.toLowerCase()}`;
  }
  
  // If it's just keywords, structure it as a request
  if (prompt.split(' ').length <= 5 && !prompt.includes('please') && !prompt.includes('help')) {
    return `I need help with ${prompt.toLowerCase()}. Please provide a detailed solution.`;
  }
  
  return prompt;
}

function hasContext(prompt: string): boolean {
  // Check if prompt provides context about the use case, requirements, or environment
  const contextIndicators = [
    /for (a|an|the|my)/i,
    /using/i,
    /with (the|a|an)/i,
    /in (my|the|a)/i,
    /that (can|will|should)/i,
    /requirements?/i,
    /project/i,
    /application/i,
    /system/i
  ];
  
  return contextIndicators.some(pattern => pattern.test(prompt)) || prompt.length > 50;
}

function addContext(prompt: string): string {
  // Add context based on the type of request
  if (/^(write|create|build|make|develop)/i.test(prompt)) {
    return `${prompt}. Please include the required functionality, best practices, and any necessary dependencies or setup instructions.`;
  }
  
  if (/^(fix|debug|solve|resolve)/i.test(prompt)) {
    return `${prompt}. Please analyze the issue, explain what's causing it, and provide a step-by-step solution.`;
  }
  
  if (/^(explain|describe|tell me about)/i.test(prompt)) {
    return `${prompt}. Please provide a comprehensive explanation with examples and practical applications.`;
  }
  
  return `${prompt}. Please provide detailed guidance with specific examples and best practices.`;
}

function isComplexTask(prompt: string): boolean {
  const complexityIndicators = [
    /and|&/g,
    /also/g,
    /additionally/g,
    /furthermore/g,
    /moreover/g,
    /plus/g,
    /,/g
  ];
  
  const matches = complexityIndicators.reduce((count, pattern) => {
    return count + (prompt.match(pattern) || []).length;
  }, 0);
  
  return matches > 2 || prompt.split(' ').length > 30;
}

function breakDownComplexTask(prompt: string): string {
  // If the prompt has multiple requirements, structure them clearly
  if (prompt.includes(' and ') || prompt.includes(', ')) {
    return `${prompt}

Please break this down into clear steps and address each requirement systematically.`;
  }
  
  return prompt;
}

function isGeneric(prompt: string): boolean {
  const genericTerms = [
    'thing', 'stuff', 'something', 'anything', 'everything',
    'good', 'best', 'nice', 'cool', 'awesome',
    'simple', 'basic', 'easy', 'quick'
  ];
  
  return genericTerms.some(term => prompt.toLowerCase().includes(term));
}

function addSpecificKeywords(prompt: string): string {
  // Replace generic terms with more specific language
  let improved = prompt
    .replace(/\bthing\b/gi, 'component')
    .replace(/\bstuff\b/gi, 'functionality')
    .replace(/\bsomething\b/gi, 'a solution')
    .replace(/\bgood\b/gi, 'effective')
    .replace(/\bbest\b/gi, 'optimal')
    .replace(/\bsimple\b/gi, 'straightforward')
    .replace(/\bbasic\b/gi, 'fundamental')
    .replace(/\beasy\b/gi, 'user-friendly')
    .replace(/\bquick\b/gi, 'efficient');
  
  return improved;
}

function ensureClarityAndConciseness(prompt: string): string {
  // Remove redundant words and phrases
  let improved = prompt
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\b(um|uh|like|you know)\b/gi, '') // Filler words
    .replace(/\b(please please|help help|can can)\b/gi, (match) => match.split(' ')[0]) // Repeated words
    .trim();
  
  // Ensure proper sentence structure
  if (improved && !improved.match(/[.!?]$/)) {
    improved += '.';
  }
  
  return improved;
}