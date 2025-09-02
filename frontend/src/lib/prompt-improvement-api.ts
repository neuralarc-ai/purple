/**
 * API service for prompt improvement using random free OpenRouter models
 */

export interface PromptImprovementResponse {
  improvedPrompt: string;
  success: boolean;
  error?: string;
}

const PROMPT_IMPROVEMENT_SYSTEM_MESSAGE = `You are an expert prompt engineer. Your task is to improve user prompts to make them more effective for AI interactions.

IMPORTANT: Return ONLY the improved prompt text. Do not add any explanations, quotes, or additional content.

Guidelines for improvement:
1. Make prompts more specific and clear
2. Add relevant context where missing
3. Use natural, conversational language
4. Break down complex tasks into clear steps
5. Replace vague terms with specific keywords

Examples:
- "Training plan." → "Write a comprehensive training plan for the sales team for the launch of a brand new product."
- "Marketing talking points." → "Give me 12 thoughtful questions to ask a Chief Marketing Officer about their strategy for 2024."
- "Write about a sales job." → "Write a job description for a Senior Sales Representative, including required skills and experience, as well as a summary of our company and the position."

CRITICAL: Return ONLY the improved prompt. No quotes, no explanations, no additional text. Just the improved prompt.`;

// Vertex AI Gemini 2.0 Flash model for prompt improvement
const GEMINI_2_FLASH_MODEL = 'vertex_ai/gemini-2.0-flash';

/**
 * Gets the Gemini 2.0 Flash model for prompt improvement
 */
function getGeminiModel(): string {
  return GEMINI_2_FLASH_MODEL;
}

/**
 * Improves a prompt using Vertex AI Gemini 2.0 Flash model
 */
export async function improvePromptWithGemini(
  originalPrompt: string,
): Promise<PromptImprovementResponse> {
  try {
    if (!originalPrompt.trim()) {
      return {
        improvedPrompt: originalPrompt,
        success: false,
        error: 'Empty prompt provided',
      };
    }

    const selectedModel = getGeminiModel();
    console.log(`Using Vertex AI Gemini 2.0 Flash for prompt improvement: ${selectedModel}`);

    const response = await fetch('/api/improve-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: originalPrompt,
        model: selectedModel,
        systemMessage: PROMPT_IMPROVEMENT_SYSTEM_MESSAGE,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      improvedPrompt: data.improvedPrompt || originalPrompt,
      success: true,
    };
  } catch (error) {
    console.error('Error improving prompt:', error);
    return {
      improvedPrompt: originalPrompt,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Keep the old function name for backward compatibility
export const improvePromptWithOpenRouter = improvePromptWithGemini;
