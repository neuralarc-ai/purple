# AWS Bedrock Rate Limit Solution

## Problem Analysis

The 429 "Too Many Requests" error you're experiencing is **not** about request count limits (200 requests per minute), but about **token limits**. The specific error message "Too many tokens, please wait before trying again" indicates you're hitting AWS Bedrock's **Tokens Per Minute (TPM)** limit.

### Root Causes:

1. **Token vs Request Limits**: Your 200 input per minute refers to requests, but AWS Bedrock also enforces token limits
2. **Large Context**: Your requests contain very large payloads (300k+ characters visible in the error)
3. **Insufficient Retry Logic**: The existing retry mechanism doesn't handle Bedrock's specific rate limiting patterns

## Solution Implementation

I've implemented a comprehensive solution with the following components:

### 1. Enhanced Rate Limit Handling (`backend/services/llm.py`)

- **Bedrock-Specific Retry Logic**: Added `bedrock_retry_with_backoff()` function with:
  - 10 retry attempts (vs standard 5)
  - Exponential backoff with jitter (2s base delay, max 60s)
  - Specific detection of Bedrock rate limit errors
  - Proper error classification and handling

- **Token Estimation**: Added `estimate_bedrock_tokens()` function to:
  - Estimate token count before making requests
  - Warn about large requests (>100k tokens)
  - Help with rate limit management

- **Model Detection**: Automatically detects Bedrock models and applies specialized handling

### 2. Aggressive Context Compression (`backend/agentpress/context_manager.py`)

- **Bedrock-Specific Limits**: 
  - Caps requests at 150k tokens (vs 200k+ for other models)
  - More aggressive compression thresholds (2048 vs 4096)
  - Enhanced compression for large requests

- **Early Warning System**: Warns when requests exceed 100k tokens

### 3. Key Features

```python
# Bedrock-specific retry with exponential backoff
async def bedrock_retry_with_backoff(func, *args, **kwargs):
    for attempt in range(BEDROCK_RATE_LIMIT_RETRIES):
        try:
            return await func(*args, **kwargs)
        except LiteLLMRateLimitError as e:
            if "bedrock" in str(e).lower() or "too many tokens" in str(e).lower():
                delay = min(BEDROCK_BASE_DELAY * (2 ** attempt) + jitter, BEDROCK_MAX_DELAY)
                await asyncio.sleep(delay)
                continue
            else:
                raise e
```

## Usage

The solution is automatically applied when using Bedrock models. No code changes needed in your application - it will:

1. **Detect Bedrock models** automatically
2. **Estimate token usage** before requests
3. **Apply aggressive compression** for large contexts
4. **Retry with exponential backoff** on rate limit errors
5. **Log warnings** for large requests

## Monitoring

The solution includes comprehensive logging:

- Token count estimation before requests
- Warnings for large requests (>100k tokens)
- Retry attempts with delay information
- Compression statistics (before/after token counts)

## Additional Recommendations

1. **Request Quota Increase**: Consider requesting a quota increase through AWS Service Quotas console
2. **Provisioned Throughput**: For high-volume applications, consider purchasing Provisioned Throughput
3. **Regional Distribution**: Distribute requests across multiple AWS regions if possible
4. **Request Optimization**: Reduce payload sizes where possible

## Testing

To test the solution:

1. The retry logic will automatically handle 429 errors
2. Monitor logs for token count warnings
3. Check that large requests are properly compressed
4. Verify exponential backoff is working correctly

## Files Modified

- `backend/services/llm.py`: Enhanced rate limit handling and token estimation
- `backend/agentpress/context_manager.py`: Aggressive compression for Bedrock models

The solution should significantly reduce 429 errors while maintaining functionality for your Bedrock-based applications.
