"""
LLM API interface for making calls to various language models.

This module provides a unified interface for making API calls to different LLM providers
(OpenAI, Anthropic, Groq, xAI, etc.) using LiteLLM. It includes support for:
- Streaming responses
- Tool calls and function calling
- Retry logic with exponential backoff
- Model-specific configurations
- Comprehensive error handling and logging
"""

import os
from typing import Union, Dict, Any, Optional, AsyncGenerator, List
import os
import litellm
from litellm.files.main import ModelResponse
from utils.logger import logger
from utils.config import config
from utils.constants import MODEL_NAME_ALIASES

# Constants
MAX_RETRIES = 5
class LLMError(Exception):
    """Base exception for LLM-related errors."""
    pass

def setup_api_keys() -> None:
    """Set up API keys from environment variables."""
    providers = ['GEMINI']
    for provider in providers:
        key = getattr(config, f'{provider}_API_KEY')
        if key:
            logger.debug(f"API key set for provider: {provider}")
        else:
            logger.warning(f"No API key found for provider: {provider}")

    

    # Set up AWS Bedrock credentials
    # aws_access_key = config.AWS_ACCESS_KEY_ID
    # aws_secret_key = config.AWS_SECRET_ACCESS_KEY
    # aws_region = config.AWS_REGION_NAME

    # if aws_access_key and aws_secret_key and aws_region:
    #     logger.debug(f"AWS credentials set for Bedrock in region: {aws_region}")
    #     # Configure LiteLLM to use AWS credentials
    #     os.environ['AWS_ACCESS_KEY_ID'] = aws_access_key
    #     os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secret_key
    #     os.environ['AWS_REGION_NAME'] = aws_region
    # else:
    #     logger.warning(f"Missing AWS credentials for Bedrock integration - access_key: {bool(aws_access_key)}, secret_key: {bool(aws_secret_key)}, region: {aws_region}")

    # Vertex AI / Gemini via LiteLLM
    # Prefer explicit VERTEXAI_*; fall back to GOOGLE_CLOUD_* if present
    effective_vertex_project = config.VERTEXAI_PROJECT or config.GOOGLE_CLOUD_PROJECT_ID
    effective_vertex_location = config.VERTEXAI_LOCATION or config.GOOGLE_CLOUD_LOCATION

    if effective_vertex_project:
        os.environ['VERTEXAI_PROJECT'] = effective_vertex_project
        logger.debug(f"Vertex AI project set to: {effective_vertex_project}")
    if effective_vertex_location:
        os.environ['VERTEXAI_LOCATION'] = effective_vertex_location
        logger.debug(f"Vertex AI location set to: {effective_vertex_location}")
    if config.GOOGLE_APPLICATION_CREDENTIALS:
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = config.GOOGLE_APPLICATION_CREDENTIALS
        logger.debug(f"Google credentials set to: {config.GOOGLE_APPLICATION_CREDENTIALS}")




def _configure_token_limits(params: Dict[str, Any], model_name: str, max_tokens: Optional[int]) -> None:
    """Configure token limits based on model type."""
    if max_tokens is None:
        return
    
    if model_name.startswith("bedrock/") and "claude-4" in model_name:
        # For Claude 3.7 in Bedrock, do not set max_tokens or max_tokens_to_sample
        # as it causes errors with inference profiles
        logger.debug(f"Skipping max_tokens for Claude 4 model: {model_name}")
        return
    
    is_openai_o_series = 'o1' in model_name
    is_openai_gpt5 = 'gpt-5' in model_name
    param_name = "max_completion_tokens" if (is_openai_o_series or is_openai_gpt5) else "max_tokens"
    params[param_name] = max_tokens

def _apply_anthropic_caching(messages: List[Dict[str, Any]]) -> None:
    """Apply Anthropic caching to the messages."""

    # Apply cache control to the first 4 text blocks across all messages
    cache_control_count = 0
    max_cache_control_blocks = 3
    
    for message in messages:
        if cache_control_count >= max_cache_control_blocks:
            break
            
        content = message.get("content")
        
        if isinstance(content, str):
            message["content"] = [
                {"type": "text", "text": content, "cache_control": {"type": "ephemeral"}}
            ]
            cache_control_count += 1
        elif isinstance(content, list):
            for item in content:
                if cache_control_count >= max_cache_control_blocks:
                    break
                if isinstance(item, dict) and item.get("type") == "text" and "cache_control" not in item:
                    item["cache_control"] = {"type": "ephemeral"}
                    cache_control_count += 1

def _apply_vertex_claude_caching(messages: List[Dict[str, Any]]) -> None:
    """Apply Vertex AI Claude caching to the messages (same as Anthropic)."""
    # Vertex AI Claude uses the same caching mechanism as Anthropic
    _apply_anthropic_caching(messages)

def _apply_gemini_caching(params: Dict[str, Any]) -> None:
    """Apply Gemini caching parameters."""
    # Disable caching for Gemini models to prevent random outputs
    if "gemini" in params.get("model", "").lower():
        # Disable caching for Gemini models
        params["cache"] = False
        logger.debug("Disabled Gemini caching to prevent random outputs")

def _apply_bedrock_caching(messages: List[Dict[str, Any]]) -> None:
    """Apply AWS Bedrock prompt caching to messages using official Anthropic format.
    
    For AWS Bedrock Claude models, we use the same caching mechanism as Anthropic:
    1. Static content (system prompts, tools, examples) is cached
    2. Dynamic content (user messages) is marked as ephemeral
    3. We use cache_control blocks to separate cached from non-cached content
    """
    if not messages:
        return
    
    # Apply cache control to the first 4 text blocks across all messages
    # This follows the official Anthropic prompt caching documentation
    cache_control_count = 0
    max_cache_control_blocks = 4  # Anthropic supports up to 4 cache breakpoints
    
    for message in messages:
        if cache_control_count >= max_cache_control_blocks:
            break
            
        content = message.get("content")
        
        if isinstance(content, str):
            # For system messages, don't add cache_control (they get cached)
            # For user messages, add cache_control as ephemeral
            if message.get("role") == "system":
                message["content"] = [
                    {"type": "text", "text": content}
                ]
            else:
                message["content"] = [
                    {"type": "text", "text": content, "cache_control": {"type": "ephemeral"}}
                ]
            cache_control_count += 1
        elif isinstance(content, list):
            for item in content:
                if cache_control_count >= max_cache_control_blocks:
                    break
                if isinstance(item, dict) and item.get("type") == "text":
                    # For system messages, don't add cache_control
                    # For user messages, add cache_control as ephemeral
                    if message.get("role") != "system" and "cache_control" not in item:
                        item["cache_control"] = {"type": "ephemeral"}
                    cache_control_count += 1
    
    logger.debug("Applied AWS Bedrock prompt caching with official Anthropic format")

def _configure_anthopic(params: Dict[str, Any], model_name: str, messages: List[Dict[str, Any]]) -> None:
    """Configure Anthropic-specific parameters."""
    if not ("claude" in model_name.lower() or "anthropic" in model_name.lower()):
        return
    
    params["extra_headers"] = {
        "anthropic-beta": "output-128k-2025-02-19"
    }
    logger.debug("Added Anthropic-specific headers")
    # Caching is now handled centrally in _configure_caching



# def _configure_bedrock(params: Dict[str, Any], model_name: str, model_id: Optional[str]) -> None:
#     """Configure Bedrock-specific parameters."""
#     if not model_name.startswith("bedrock/"):
#         return
    
#     logger.debug(f"Preparing AWS Bedrock parameters for model: {model_name}")

#     # Auto-set model_id for Claude 3.7 Sonnet if not provided
#     if not model_id and "anthropic.claude-3-7-sonnet" in model_name:
#         params["model_id"] = "arn:aws:bedrock:us-west-2:935064898258:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0"
#         logger.debug(f"Auto-set model_id for Claude 3.7 Sonnet: {params['model_id']}")

# def _configure_openai_gpt5(params: Dict[str, Any], model_name: str) -> None:
#     """Configure OpenAI GPT-5 specific parameters."""
#     if "gpt-5" not in model_name:
#         return
    

#     # Drop unsupported temperature param (only default 1 allowed)
#     if "temperature" in params and params["temperature"] != 1:
#         params.pop("temperature", None)

#     # Request priority service tier when calling OpenAI directly


# def _configure_kimi_k2(params: Dict[str, Any], model_name: str) -> None:
#     """Configure Kimi K2-specific parameters."""
#     is_kimi_k2 = "kimi-k2" in model_name.lower() or model_name.startswith("moonshotai/kimi-k2")
#     if not is_kimi_k2:
#         return
    
#     params["provider"] = {
#         "order": ["groq", "moonshotai"] #, "groq", "together/fp8", "novita/fp8", "baseten/fp8", 
#     }

def _configure_vertex_ai(params: Dict[str, Any], model_name: str) -> None:
    """Configure Vertex AI-specific parameters for Gemini and Claude models via LiteLLM."""
    is_vertex_route = model_name.startswith("vertex_ai/")
    is_vertex_legacy = model_name.startswith("vertex/")  # Handle legacy vertex/ prefix
    is_gemini_direct = model_name.startswith("gemini/")
    if not (is_vertex_route or is_vertex_legacy or is_gemini_direct):
        return

    # Extract region from model name if specified (e.g., vertex_ai/claude-sonnet-4@20250514-us-east5)
    model_region = None
    if (is_vertex_route or is_vertex_legacy) and "-" in model_name:
        # Check if model name contains region specification
        parts = model_name.split("-")
        if len(parts) >= 2:
            potential_region = parts[-1]
            # Validate if it looks like a region (e.g., us-east5, us-central1)
            if potential_region.startswith("us-") or potential_region.startswith("europe-") or potential_region.startswith("asia-"):
                model_region = potential_region

    # If calling Vertex route, pass dynamic params when available
    if is_vertex_route or is_vertex_legacy:
        # Credentials could be json string or path
        if config.VERTEXAI_CREDENTIALS:
            params["vertex_credentials"] = config.VERTEXAI_CREDENTIALS
        if config.VERTEXAI_PROJECT:
            params["vertex_project"] = config.VERTEXAI_PROJECT
        
        # Determine the appropriate region based on model type
        if model_region:
            # Use explicit region from model name if specified
            params["vertex_location"] = model_region
            logger.debug(f"Using model-specific Vertex AI region: {model_region}")
        else:
            # Auto-detect region based on model type
            if "claude" in model_name.lower():
                # Claude models use us-central1 (all models available here)
                params["vertex_location"] = "us-central1"
                logger.debug(f"Claude model detected, using us-central1 region")
            elif "gemini" in model_name.lower():
                # Gemini models use us-central1
                params["vertex_location"] = "us-central1"
                logger.debug(f"Gemini model detected, using us-central1 region")
            else:
                # Fall back to config or default
                if config.VERTEXAI_LOCATION:
                    params["vertex_location"] = config.VERTEXAI_LOCATION
                elif config.GOOGLE_CLOUD_LOCATION:
                    params["vertex_location"] = config.GOOGLE_CLOUD_LOCATION
                else:
                    # Default to us-central1 for unknown models
                    params["vertex_location"] = "us-central1"
                    logger.debug(f"Unknown model type, defaulting to us-central1 region")

    # Check if this is a Claude model on Vertex AI
    is_vertex_claude = (is_vertex_route or is_vertex_legacy) and "claude" in model_name.lower()
    
    # Support reasoning mapping for Gemini per LiteLLM docs using reasoning_effort
    # For Claude models on Vertex AI, we use the thinking parameter
    # (Handled centrally in _configure_thinking for other providers. For Vertex, we keep effort on params)

    # Ensure token param compatibility
    if "max_tokens" in params:
        if is_vertex_claude:
            # For Claude models on Vertex AI, keep max_tokens as is
            # LiteLLM will handle the mapping to the appropriate parameter
            pass

        else:
            # For Gemini unified or vertex routes, LiteLLM handles this but we align to max_output_tokens if needed
            params["max_output_tokens"] = params.pop("max_tokens")

def _configure_thinking(params: Dict[str, Any], model_name: str, enable_thinking: Optional[bool], reasoning_effort: Optional[str]) -> None:
    """Configure reasoning/thinking parameters for supported models."""
    if not enable_thinking:
        return
    

    effort_level = reasoning_effort or 'low'
    is_anthropic = "anthropic" in model_name.lower() or "claude" in model_name.lower()
    is_xai = "xai" in model_name.lower() or model_name.startswith("xai/")
    is_vertex_gemini = model_name.startswith("vertex_ai/") or model_name.startswith("vertex/") or model_name.startswith("gemini/")
    is_vertex_claude = (model_name.startswith("vertex_ai/") or model_name.startswith("vertex/")) and "claude" in model_name.lower()
    
    if is_anthropic and not is_vertex_claude:
        # Standard Anthropic models (not on Vertex AI)
        params["reasoning_effort"] = effort_level
        params["temperature"] = 1.0  # Required by Anthropic when reasoning_effort is used
        logger.info(f"Anthropic thinking enabled with reasoning_effort='{effort_level}'")
    elif is_vertex_claude:
        # Claude models on Vertex AI use the thinking parameter
        params["thinking"] = {"type": "enabled", "budget_tokens": 1024}
        logger.info(f"Vertex AI Claude thinking enabled with thinking parameter")
    # elif is_xai:
    #     params["reasoning_effort"] = effort_level
    #     logger.info(f"xAI thinking enabled with reasoning_effort='{effort_level}'")
    elif is_vertex_gemini and not is_vertex_claude:
        # LiteLLM maps OpenAI-style reasoning_effort to Gemini thinking budget
        params["reasoning_effort"] = effort_level
        logger.info(f"Vertex Gemini thinking enabled with reasoning_effort='{effort_level}'")



def _add_tools_config(params: Dict[str, Any], tools: Optional[List[Dict[str, Any]]], tool_choice: str) -> None:
    """Add tools configuration to parameters."""
    if tools is None:
        return
    
    params.update({
        "tools": tools,
        "tool_choice": tool_choice
    })
    logger.debug(f"Added {len(tools)} tools to API parameters")

def _configure_caching(params: Dict[str, Any], model_name: str, messages: List[Dict[str, Any]]) -> None:
    """Configure caching for supported models."""
    is_anthropic = "anthropic" in model_name.lower() or "claude" in model_name.lower()
    is_vertex_claude = (model_name.startswith("vertex_ai/") or model_name.startswith("vertex/")) and "claude" in model_name.lower()
    is_gemini = "gemini" in model_name.lower()
    is_bedrock_claude = model_name.startswith("bedrock/") and "claude" in model_name.lower()
    
    if is_bedrock_claude:
        # AWS Bedrock Claude models - use official Anthropic prompt caching format
        # No need to set promptCaching parameter - cache_control blocks handle this
        logger.debug(f"Enabled AWS Bedrock prompt caching for {model_name}")
        
        # Structure messages for Bedrock prompt caching using official Anthropic format
        _apply_bedrock_caching(messages)
    elif is_anthropic and not is_vertex_claude:
        # Standard Anthropic models
        _apply_anthropic_caching(messages)
        logger.debug("Applied Anthropic caching")
    elif is_vertex_claude:
        # Vertex AI Claude models
        _apply_vertex_claude_caching(messages)
        logger.debug("Applied Vertex AI Claude caching")
    elif is_gemini:
        # Gemini models
        _apply_gemini_caching(params)
        logger.debug("Applied Gemini caching")

def prepare_params(
    messages: List[Dict[str, Any]],
    model_name: str,
    temperature: float = 0.3,
    max_tokens: Optional[int] = None,
    response_format: Optional[Any] = None,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: str = "auto",
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    stream: bool = False,
    top_p: Optional[float] = None,
    model_id: Optional[str] = None,
    enable_thinking: Optional[bool] = False,
    reasoning_effort: Optional[str] = 'low',
    num_retries: Optional[int] = None,
    request_timeout: Optional[float] = None,
) -> Dict[str, Any]:
    """Prepare parameters for the API call."""
    params = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature,
        "response_format": response_format,
        "top_p": top_p,
        "stream": stream,
        "num_retries": (num_retries if isinstance(num_retries, int) and num_retries >= 0 else MAX_RETRIES),
    }

    if request_timeout is not None:
        params["timeout"] = request_timeout

    if api_key:
        params["api_key"] = api_key
    if api_base:
        params["api_base"] = api_base
    if model_id:
        params["model_id"] = model_id

    # Handle token limits
    _configure_token_limits(params, model_name, max_tokens)
    # Add tools if provided
    _add_tools_config(params, tools, tool_choice)
    # Add Anthropic-specific parameters
    # _configure_anthopic(params, model_name, params["messages"])
    # # Add Bedrock-specific parameters
    # _configure_bedrock(params, model_name, model_id)
    
    # _add_fallback_model(params, model_name, messages)
    # Add OpenAI GPT-5 specific parameters
    # _configure_openai_gpt5(params, model_name)
    # Add Kimi K2-specific parameters
    # _configure_kimi_k2(params, model_name)
    # Add Vertex/Gemini-specific parameters
    _configure_vertex_ai(params, model_name)
    _configure_thinking(params, model_name, enable_thinking, reasoning_effort)
    _configure_caching(params, model_name, messages)

    return params

async def make_llm_api_call(
    messages: List[Dict[str, Any]],
    model_name: str,
    response_format: Optional[Any] = None,
    temperature: float = 0.3,
    max_tokens: Optional[int] = None,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: str = "auto",
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    stream: bool = False,
    top_p: Optional[float] = None,
    model_id: Optional[str] = None,
    enable_thinking: Optional[bool] = False,
    reasoning_effort: Optional[str] = 'low',
    num_retries: Optional[int] = None,
    request_timeout: Optional[float] = None,
) -> Union[Dict[str, Any], AsyncGenerator, ModelResponse]:
    """
    Make an API call to a language model using LiteLLM.

    Args:
        messages: List of message dictionaries for the conversation
        model_name: Name of the model to use (e.g., "gpt-4", "claude-3", "bedrock/anthropic.claude-3-sonnet-20240229-v1:0")
        response_format: Desired format for the response
        temperature: Sampling temperature (0-1)
        max_tokens: Maximum tokens in the response
        tools: List of tool definitions for function calling
        tool_choice: How to select tools ("auto" or "none")
        api_key: Override default API key
        api_base: Override default API base URL
        stream: Whether to stream the response
        top_p: Top-p sampling parameter
        model_id: Optional ARN for Bedrock inference profiles
        enable_thinking: Whether to enable thinking
        reasoning_effort: Level of reasoning effort

    Returns:
        Union[Dict[str, Any], AsyncGenerator]: API response or stream

    Raises:
        LLMRetryError: If API call fails after retries
        LLMError: For other API-related errors
    """
    # Resolve model alias if present
    resolved_model_name = MODEL_NAME_ALIASES.get(model_name, model_name)
    
    # debug <timestamp>.json messages
    logger.debug(f"Making LLM API call to model: {resolved_model_name} (original: {model_name}, Thinking: {enable_thinking}, Effort: {reasoning_effort})")
    logger.debug(f"📡 API Call: Using model {resolved_model_name}")
    params = prepare_params(
        messages=messages,
        model_name=resolved_model_name,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format=response_format,
        tools=tools,
        tool_choice=tool_choice,
        api_key=api_key,
        api_base=api_base,
        stream=stream,
        top_p=top_p,
        model_id=model_id,
        enable_thinking=enable_thinking,
        reasoning_effort=reasoning_effort,
        num_retries=num_retries,
        request_timeout=request_timeout,
    )
    try:
        # Use LiteLLM for models
        response = await litellm.acompletion(**params)
        logger.debug(f"Successfully received API response from {resolved_model_name}")
        # logger.debug(f"Response: {response}")
        return response

    except Exception as e:
        logger.error(f"Unexpected error during API call: {str(e)}", exc_info=True)
        raise LLMError(f"API call failed: {str(e)}")


# Initialize API keys on module import
setup_api_keys()