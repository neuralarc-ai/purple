/**
 * API service for prompt improvement using random free OpenRouter models
 */

export interface PromptImprovementResponse {
  improvedPrompt: string;
  success: boolean;
  error?: string;
}

const PROMPT_IMPROVEMENT_SYSTEM_MESSAGE = `You are an expert prompt engineer. Your task is to improve user prompts to make them more effective for AI interactions. Follow these guidelines:

1. **Use Natural Language**: Make prompts conversational and friendly
2. **Be Clear and Concise**: Remove ambiguity while maintaining clarity
3. **Provide Context**: Add relevant context to help understand the request
4. **Use Specific Keywords**: Replace vague terms with specific, relevant keywords
5. **Break Down Complex Tasks**: Structure multi-part requests clearly

Examples of improvements:
- "Training plan." → "Write a training plan for the sales team for the launch of a brand new product."
- "Marketing talking points." → "Give me 12 thoughtful questions to ask a Chief Marketing Officer on their strategy for 2024."
- "Write about a sales job." → "Write a job description for a [job title], including the required skills and experience, as well as a summary of [company name] and the position."
- "Create project plan." → "Create a project plan for the launch of a brand new product. The timeframe should be from now until June 2025."

Rules:
- Keep the user's original intent intact
- Only improve clarity, specificity, and structure
- Don't change the core request
- Make it sound natural and conversational
- Add helpful context where missing
- If the prompt is already well-structured, make minimal changes
- Do NOT add quotes around your response

Return ONLY the improved prompt text, nothing else. No quotes, no explanations, just the improved prompt.`;

// Free OpenRouter models for prompt improvement
const FREE_OPENROUTER_MODELS = [
  'openrouter/mistralai/mistral-small-3.2-24b-instruct:free',
  'openrouter/deepseek/deepseek-chat-v3.1:free',
  'openrouter/meta-llama/llama-4-maverick:free',
];

/**
 * Gets a random free OpenRouter model for prompt improvement
 */
function getRandomOpenRouterModel(): string {
  const randomIndex = Math.floor(Math.random() * FREE_OPENROUTER_MODELS.length);
  return FREE_OPENROUTER_MODELS[randomIndex];
}

/**
 * Improves a prompt using a random free OpenRouter model
 */
export async function improvePromptWithOpenRouter(
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

    const selectedModel = getRandomOpenRouterModel();
    console.log(`Using OpenRouter model for prompt improvement: ${selectedModel}`);

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
export const improvePromptWithGemini = improvePromptWithOpenRouter;
